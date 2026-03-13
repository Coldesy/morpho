// ============================================================
// Morpho 2.0 — Text to 3D Scene Generator
// ============================================================

import { SceneComposition } from '@/types/types';
import { callLLMWithJSON } from './llmClient';

/**
 * Generate a multi-object scene composition from a paragraph query.
 */
export async function generateScene(query: string): Promise<SceneComposition> {
    const prompt = `You are an AI scene assembler. The user has provided a descriptive paragraph.
Extract the key physical objects and their spatial or functional relationships, and generate a 3D scene layout.

Input Paragraph: "${query}"

Return a JSON object matching this exact schema:
{
  "objects": [
    {
      "name": "Object Name (e.g. sun, earth, table)",
      "position": [x, y, z] // Provide rough 3D coordinates based on the description
    }
  ],
  "relationships": [
    {
      "type": "Relationship type (e.g. orbit, on_top_of, inside)",
      "source": "Subject object name",
      "target": "Target object name"
    }
  ]
}

Rules:
- Keep the number of major objects between 2 and 6.
- Base coordinates around the origin [0,0,0], spacing them out logically (e.g., [5,0,0] for something next to it).
- Focus only on physical nouns.
- Return ONLY the JSON.`;

    try {
        return await callLLMWithJSON<SceneComposition>(prompt);
    } catch (e) {
        console.error('generateScene error:', e);
        // Fallback simple scene
        return {
            objects: [
                { name: 'center object', position: [0, 0, 0] },
                { name: 'orbiting object', position: [5, 0, 0] }
            ],
            relationships: [
                { type: 'orbit', source: 'orbiting object', target: 'center object' }
            ]
        };
    }
}
