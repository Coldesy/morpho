// ============================================================
// Morpho 2.0 — Audio Explainer / Accessibility Narration
// ============================================================

import { ConceptAnalysis } from '@/types/types';
import { callLLM } from './llmClient';

/**
 * Generate an accessible audio description of a concept's 3D model.
 * Uses spatial language to help listeners form a mental image.
 */
export async function generateAudioDescription(
    concept: string,
    components: string[],
    structuralDescription: string
): Promise<string> {
    const prompt = `Describe the structure of "${concept}" in simple, accessible language suitable for someone who cannot see a 3D model.

Key components: ${components?.join(', ') ?? 'N/A'}
Structure: ${structuralDescription ?? 'N/A'}

Write 2-3 short paragraphs. Use spatial language (top, bottom, left, right, inside, outside) to help the listener form a mental image. Keep it educational and clear.`;

    try {
        return await callLLM(prompt);
    } catch {
        // Fallback to a basic description
        return `This is a 3D visualization of ${concept}. It consists of the following components: ${
            components?.join(', ') ?? 'various parts'
        }. ${structuralDescription ?? ''}`;
    }
}

/**
 * Generate a guided learning narration for a concept.
 * Returns an array of narration steps for guided mode.
 */
export interface GuidedStep {
    component: string;
    narration: string;
}

export async function generateGuidedNarration(
    concept: ConceptAnalysis
): Promise<GuidedStep[]> {
    try {
        const prompt = `Create a guided learning narration for "${concept.concept}".
For each component, write a brief educational explanation (1-2 sentences).

Components: ${concept.components.join(', ')}
Structure: ${concept.structural_description}

Return a JSON array:
[
  { "component": "Component Name", "narration": "Brief educational explanation" }
]
Return ONLY the JSON array.`;

        const raw = await callLLM(prompt);
        let cleaned = raw.trim();
        if (cleaned.startsWith('```')) {
            cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
        }
        return JSON.parse(cleaned) as GuidedStep[];
    } catch {
        return concept.components.map((c) => ({
            component: c,
            narration: `This is the ${c} of the ${concept.concept}.`,
        }));
    }
}
