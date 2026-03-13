// ============================================================
// Morpho 2.0 — Hybrid Model Validator
// Score = 0.4×semantic + 0.3×LLM + 0.2×metadata + 0.1×geometry
// ============================================================

import { ConceptAnalysis, ModelValidation, SketchfabModel } from '@/types/types';
import { callLLMWithJSON } from './llmClient';
import { scoreModels } from './semanticSearch';

interface LLMValidationResult {
    model_id: string;
    relevance_score: number;
    structural_accuracy: number;
    educational_value: number;
    confidence: number;
    explanation: string;
}

/**
 * Compute metadata quality score for a model (0-1).
 */
function metadataQualityScore(model: SketchfabModel): number {
    let score = 0;

    // Has description
    if (model.description && model.description.length > 20) score += 0.3;
    else if (model.description) score += 0.1;

    // Has tags
    if (model.tags && model.tags.length >= 5) score += 0.3;
    else if (model.tags && model.tags.length > 0) score += 0.15;

    // Has author
    if (model.author && model.author !== 'Unknown') score += 0.1;

    // Has preview
    if (model.preview_url) score += 0.1;

    // Is downloadable
    if (model.is_downloadable) score += 0.2;

    return Math.min(1, score);
}

/**
 * Compute geometry complexity score for a model (0-1).
 */
function geometryComplexityScore(model: SketchfabModel): number {
    const poly = model.polygon_count || 0;

    if (poly > 100000) return 1.0;
    if (poly > 50000) return 0.85;
    if (poly > 10000) return 0.7;
    if (poly > 5000) return 0.55;
    if (poly > 1000) return 0.4;
    if (poly > 0) return 0.25;
    return 0.1;
}

/**
 * Get LLM reasoning scores for top candidate models.
 */
async function getLLMReasoningScores(
    concept: ConceptAnalysis,
    models: SketchfabModel[]
): Promise<LLMValidationResult[]> {
    const modelSummaries = models.map((m) => ({
        model_id: m.uid,
        name: m.name,
        description: m.description?.slice(0, 200),
        tags: m.tags?.slice(0, 10),
        polygon_count: m.polygon_count,
    }));

    const prompt = `You are a strict 3D model curator evaluating Sketchfab models for educational accuracy.

TARGET CONCEPT: "${concept.concept}"
Category: "${concept.category}"
Required components: ${JSON.stringify(concept.components)}

CANDIDATE MODELS:
${JSON.stringify(modelSummaries, null, 2)}

Score each model (0.0 to 1.0):

1. relevance_score: Does the model directly represent the target concept?
   - 0.9-1.0: Exact match
   - 0.7-0.8: Name matches, tags correct
   - 0.5-0.6: Related but not exact
   - 0.1-0.4: Same category but different
   - 0.0: Unrelated

2. structural_accuracy: Does it represent the correct structure?
   - 1.0: All key components present
   - 0.7: Most present
   - 0.4: Simplified
   - 0.1: Wrong structure

3. educational_value: Suitable for learning?
   - 1.0: Detailed, labelled
   - 0.7: Accurate but unlabelled
   - 0.4: Decorative
   - 0.1: Not useful

4. confidence: Overall confidence in the evaluation (0.0-1.0)

RULES:
- Use the FULL scoring range
- Stylised cartoon max 0.5 structural_accuracy
- Low polygon (<5000) cap structural_accuracy at 0.6

Return a JSON array:
[
  {
    "model_id": "uid",
    "relevance_score": 0.0-1.0,
    "structural_accuracy": 0.0-1.0,
    "educational_value": 0.0-1.0,
    "confidence": 0.0-1.0,
    "explanation": "Why this model is or isn't a good match."
  }
]
Return ONLY the JSON array.`;

    try {
        return await callLLMWithJSON<LLMValidationResult[]>(prompt);
    } catch {
        // If LLM fails, return neutral scores
        return models.map((m) => ({
            model_id: m.uid,
            relevance_score: 0.5,
            structural_accuracy: 0.5,
            educational_value: 0.5,
            confidence: 0.3,
            explanation: 'LLM validation unavailable',
        }));
    }
}

export interface HybridValidationResult {
    model: SketchfabModel;
    validation: ModelValidation;
    composite_score: number;
    breakdown: {
        semantic: number;
        llm_reasoning: number;
        metadata: number;
        geometry: number;
    };
}

/**
 * Perform hybrid validation on candidate models.
 * Returns models ranked by composite score.
 */
export async function hybridValidate(
    concept: ConceptAnalysis,
    query: string,
    models: SketchfabModel[]
): Promise<HybridValidationResult[]> {
    if (models.length === 0) return [];

    // Step 1: Semantic similarity scoring
    const semanticScores = await scoreModels(query, models);
    const semanticMap = new Map(
        semanticScores.map((s) => [s.model_uid, s.semantic_similarity])
    );

    // Step 2: LLM reasoning scores (send top 5 by semantic score)
    const topModels = semanticScores
        .slice(0, 5)
        .map((s) => models.find((m) => m.uid === s.model_uid)!)
        .filter(Boolean);

    const llmScores = await getLLMReasoningScores(concept, topModels);
    const llmMap = new Map(llmScores.map((s) => [s.model_id, s]));

    // Step 3: Combine scores
    const results: HybridValidationResult[] = models.map((model) => {
        const semantic = semanticMap.get(model.uid) ?? 0;
        const llm = llmMap.get(model.uid);
        const llmComposite = llm
            ? (llm.relevance_score + llm.structural_accuracy + llm.educational_value) / 3
            : 0.3; // neutral default
        const metadata = metadataQualityScore(model);
        const geometry = geometryComplexityScore(model);

        // Weighted composite: 0.4 semantic + 0.3 LLM + 0.2 metadata + 0.1 geometry
        const composite_score =
            0.4 * semantic + 0.3 * llmComposite + 0.2 * metadata + 0.1 * geometry;

        return {
            model,
            validation: {
                model_id: model.uid,
                relevance_score: composite_score,
                structural_accuracy: llm?.structural_accuracy ?? 0.5,
                educational_usefulness: llm?.educational_value ?? 0.5,
                explanation: llm?.explanation ?? `Model "${model.name}" — semantic match: ${(semantic * 100).toFixed(0)}%`,
            },
            composite_score,
            breakdown: {
                semantic,
                llm_reasoning: llmComposite,
                metadata,
                geometry,
            },
        };
    });

    // Sort descending by composite score
    results.sort((a, b) => b.composite_score - a.composite_score);
    return results;
}
