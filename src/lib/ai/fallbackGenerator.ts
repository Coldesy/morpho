// ============================================================
// Morpho 2.0 — Multi-Mode Fallback Generator
// Mode 1: Tripo AI generation
// Mode 2: Procedural primitive synthesis
// Mode 3: Semantic substitution
// ============================================================

import { ConceptAnalysis, PrimitiveComposition, ModelSource } from '@/types/types';
import { generateTripoModel } from '@/lib/tripo';
import { generatePrimitiveComposition } from '@/lib/primitives';
import { callLLMWithJSON } from './llmClient';

export interface FallbackResult {
    source: ModelSource;
    model_url?: string;
    primitiveConfig?: PrimitiveComposition;
    explanation: string;
    confidence: number;
}

/**
 * Mode 1: Tripo AI generation.
 */
async function tryTripoGeneration(concept: ConceptAnalysis): Promise<FallbackResult | null> {
    try {
        const prompt = `Generate a clean educational 3D model of ${concept.concept}${
            concept.components?.length
                ? ` showing the ${concept.components.join(', ')}`
                : ''
        } suitable for interactive visualization. ${concept.structural_description}`;

        const modelUrl = await generateTripoModel(prompt);
        if (modelUrl) {
            return {
                source: 'tripo',
                model_url: modelUrl,
                explanation: `AI-generated model of ${concept.concept} by Tripo AI.`,
                confidence: 0.65,
            };
        }
    } catch (err) {
        console.error('Tripo fallback error:', err);
    }
    return null;
}

/**
 * Mode 2: Procedural primitive synthesis.
 */
async function tryPrimitiveSynthesis(concept: ConceptAnalysis): Promise<FallbackResult> {
    const config = await generatePrimitiveComposition(
        concept.concept,
        concept.components,
        concept.structural_description
    );

    return {
        source: 'primitive',
        primitiveConfig: config,
        explanation: `Approximation using basic 3D shapes. ${config.description}`,
        confidence: 0.4,
    };
}

/**
 * Mode 3: Semantic substitution.
 * If the concept is too abstract, find a related concrete concept.
 */
async function trySemanticSubstitution(
    concept: ConceptAnalysis
): Promise<{ substitutedQuery: string; explanation: string } | null> {
    try {
        const result = await callLLMWithJSON<{
            substitute: string;
            reasoning: string;
        }>(`The concept "${concept.concept}" is difficult to represent as a 3D model.
Suggest a closely related, concrete object that could visually represent this concept.

Examples:
- "Gravity" → "gravitational well visualization"
- "Black Hole" → "accretion disk with gravitational lensing"
- "Democracy" → "voting ballot box"
- "Evolution" → "evolutionary tree of life"

Return JSON: { "substitute": "concrete visual object", "reasoning": "why this represents the concept" }
Return ONLY the JSON.`);

        if (result.substitute && result.substitute !== concept.concept) {
            return {
                substitutedQuery: result.substitute,
                explanation: `Using "${result.substitute}" as a visual representation. ${result.reasoning}`,
            };
        }
    } catch {
        // Semantic substitution is optional
    }
    return null;
}

/**
 * Run the full fallback cascade:
 * 1. Tripo AI generation
 * 2. Semantic substitution → Tripo retry
 * 3. Procedural primitives (always succeeds)
 */
export async function generateFallback(concept: ConceptAnalysis): Promise<FallbackResult> {
    // Mode 1: Tripo AI
    const tripoResult = await tryTripoGeneration(concept);
    if (tripoResult) return tripoResult;

    // Mode 3→1: Semantic substitution + Tripo retry
    const substitution = await trySemanticSubstitution(concept);
    if (substitution) {
        const subConcept: ConceptAnalysis = {
            ...concept,
            concept: substitution.substitutedQuery,
        };
        const subTripo = await tryTripoGeneration(subConcept);
        if (subTripo) {
            return {
                ...subTripo,
                source: 'semantic_fallback' as ModelSource,
                explanation: substitution.explanation,
                confidence: 0.55,
            };
        }
    }

    // Mode 2: Procedural primitives (guaranteed fallback)
    return tryPrimitiveSynthesis(concept);
}
