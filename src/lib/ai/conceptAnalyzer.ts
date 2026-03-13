// ============================================================
// Morpho 2.0 — Concept Analyzer
// Uses the multi-model LLM client for concept analysis
// ============================================================

import { ConceptAnalysis } from '@/types/types';
import { callLLMWithJSON } from './llmClient';

/**
 * Analyze a concept query and return structured analysis.
 * Falls back through OpenRouter → Groq models automatically.
 */
export async function analyzeConcept(query: string): Promise<ConceptAnalysis> {
    const prompt = `You are a concept analysis AI. Analyze the following concept and return a JSON object.

Concept: "${query}"

Return this exact JSON schema:
{
  "concept": "proper name of the concept",
  "category": "one of: object, biological, structure, phenomenon, abstract, mechanical, celestial, geological",
  "components": ["list", "of", "key", "parts"],
  "structural_description": "Brief description of the physical structure and shape",
  "similar_objects": ["similar", "searchable", "terms"],
  "geometry_type": "organic | geometric | mixed | abstract",
  "complexity": "low | medium | high"
}

Return ONLY the JSON, no extra text.`;

    return callLLMWithJSON<ConceptAnalysis>(prompt);
}

/**
 * Generate an educational breakdown for a concept.
 * Returns overview, components explanation, and how-it-works.
 */
export interface EducationalBreakdown {
    overview: string;
    components_explanation: { name: string; description: string }[];
    how_it_works: string;
}

export async function generateEducationalBreakdown(
    concept: ConceptAnalysis
): Promise<EducationalBreakdown> {
    const prompt = `You are an educational AI. Create a brief, engaging educational breakdown of "${concept.concept}".

Category: ${concept.category}
Components: ${concept.components.join(', ')}
Structure: ${concept.structural_description}

Return a JSON object with:
{
  "overview": "A 2-3 sentence overview of the concept and why it matters",
  "components_explanation": [
    { "name": "Component Name", "description": "One sentence explaining this component" }
  ],
  "how_it_works": "A 2-3 sentence explanation of how the concept works or functions"
}

Keep each section concise. Return ONLY the JSON.`;

    try {
        return await callLLMWithJSON<EducationalBreakdown>(prompt);
    } catch {
        // Graceful fallback
        return {
            overview: `${concept.concept} is a ${concept.category} concept. ${concept.structural_description}`,
            components_explanation: concept.components.map((c) => ({
                name: c,
                description: `A key component of ${concept.concept}.`,
            })),
            how_it_works: concept.structural_description,
        };
    }
}
