// ============================================================
// Primitive Composition Generator
// Uses Gemini to create Three.js primitive configs for fallback
// ============================================================

import { PrimitiveComposition } from '@/types/types';
import { callLLMWithJSON } from './ai/llmClient';

/** Pre-defined compositions for common concepts */
const KNOWN_PRIMITIVES: Record<string, PrimitiveComposition> = {
    tree: {
        description: 'A simple tree with trunk and foliage',
        shapes: [
            { type: 'cylinder', position: [0, -0.5, 0], scale: [0.3, 1.5, 0.3], color: '#8B4513', label: 'Trunk' },
            { type: 'sphere', position: [0, 1.2, 0], scale: [1.5, 1.5, 1.5], color: '#228B22', label: 'Foliage' },
            { type: 'sphere', position: [0.6, 0.8, 0.3], scale: [1, 1, 1], color: '#2E8B57', label: 'Lower Branch' },
            { type: 'sphere', position: [-0.5, 0.9, -0.2], scale: [0.9, 0.9, 0.9], color: '#32CD32', label: 'Side Branch' },
        ],
    },
    atom: {
        description: 'Simplified atom with nucleus and electron orbits',
        shapes: [
            { type: 'sphere', position: [0, 0, 0], scale: [0.5, 0.5, 0.5], color: '#FF4500', label: 'Nucleus' },
            { type: 'torus', position: [0, 0, 0], rotation: [0, 0, 0], scale: [2, 2, 0.05], color: '#4169E1', label: 'Orbit 1' },
            { type: 'torus', position: [0, 0, 0], rotation: [1.0, 0, 0], scale: [2, 2, 0.05], color: '#4169E1', label: 'Orbit 2' },
            { type: 'torus', position: [0, 0, 0], rotation: [0.5, 0.8, 0], scale: [2, 2, 0.05], color: '#4169E1', label: 'Orbit 3' },
            { type: 'sphere', position: [2, 0, 0], scale: [0.15, 0.15, 0.15], color: '#00BFFF', label: 'Electron 1' },
            { type: 'sphere', position: [-1, 1.7, 0], scale: [0.15, 0.15, 0.15], color: '#00BFFF', label: 'Electron 2' },
            { type: 'sphere', position: [0.5, -0.9, 1.5], scale: [0.15, 0.15, 0.15], color: '#00BFFF', label: 'Electron 3' },
        ],
    },
    'solar system': {
        description: 'Simplified solar system with sun and planets',
        shapes: [
            { type: 'sphere', position: [0, 0, 0], scale: [1, 1, 1], color: '#FFD700', label: 'Sun' },
            { type: 'ring', position: [0, 0, 0], rotation: [Math.PI / 2, 0, 0], scale: [2, 2, 0.01], color: '#555555', label: 'Orbit 1' },
            { type: 'sphere', position: [2, 0, 0], scale: [0.15, 0.15, 0.15], color: '#A0522D', label: 'Mercury' },
            { type: 'ring', position: [0, 0, 0], rotation: [Math.PI / 2, 0, 0], scale: [3, 3, 0.01], color: '#555555', label: 'Orbit 2' },
            { type: 'sphere', position: [3, 0, 0], scale: [0.25, 0.25, 0.25], color: '#DEB887', label: 'Venus' },
            { type: 'ring', position: [0, 0, 0], rotation: [Math.PI / 2, 0, 0], scale: [4, 4, 0.01], color: '#555555', label: 'Orbit 3' },
            { type: 'sphere', position: [4, 0, 0], scale: [0.3, 0.3, 0.3], color: '#4169E1', label: 'Earth' },
            { type: 'ring', position: [0, 0, 0], rotation: [Math.PI / 2, 0, 0], scale: [5.5, 5.5, 0.01], color: '#555555', label: 'Orbit 4' },
            { type: 'sphere', position: [5.5, 0, 0], scale: [0.2, 0.2, 0.2], color: '#CD5C5C', label: 'Mars' },
        ],
    },
    volcano: {
        description: 'Simplified volcano with cone and lava',
        shapes: [
            { type: 'cone', position: [0, 0, 0], scale: [2, 2.5, 2], color: '#8B4513', label: 'Mountain' },
            { type: 'cylinder', position: [0, 1.3, 0], scale: [0.4, 0.3, 0.4], color: '#333', label: 'Crater' },
            { type: 'sphere', position: [0, 1.5, 0], scale: [0.3, 0.3, 0.3], color: '#FF4500', label: 'Lava' },
            { type: 'sphere', position: [0.2, 1.8, 0.1], scale: [0.15, 0.15, 0.15], color: '#FF6347', label: 'Eruption' },
            { type: 'box', position: [0, -1.25, 0], scale: [6, 0.1, 6], color: '#556B2F', label: 'Ground' },
        ],
    },
};

/**
 * Generate a primitive composition for a concept.
 * First checks known compositions, then falls back to Gemini.
 */
export async function generatePrimitiveComposition(
    conceptName: string,
    components: string[],
    structuralDescription: string
): Promise<PrimitiveComposition> {
    // Check known compositions first
    const lowerName = conceptName.toLowerCase();
    for (const [key, composition] of Object.entries(KNOWN_PRIMITIVES)) {
        if (lowerName.includes(key) || key.includes(lowerName)) {
            return composition;
        }
    }

    // Ask Gemini to design a primitive composition
    const prompt = `You are a 3D designer. Create a simplified 3D representation of "${conceptName}" using only basic Three.js primitive shapes.

Concept components: ${components.join(', ')}
Description: ${structuralDescription}

Available shape types: sphere, cylinder, cone, torus, box, ring

Return a JSON object with this exact schema:
{
  "description": "Brief description of the composition",
  "shapes": [
    {
      "type": "sphere|cylinder|cone|torus|box|ring",
      "position": [x, y, z],
      "rotation": [rx, ry, rz],
      "scale": [sx, sy, sz],
      "color": "#hexcolor",
      "label": "Part name"
    }
  ]
}

Rules:
- Use 4-10 shapes maximum
- Center the composition around origin [0,0,0]
- Keep coordinates between -5 and 5
- Use realistic, appealing colors
- Label each shape with its component name
- Return ONLY the JSON, no other text`;

    try {
        return await callLLMWithJSON<PrimitiveComposition>(prompt);
    } catch {
        // Ultimate fallback: single sphere
        return {
            description: `Simplified representation of ${conceptName}`,
            shapes: [
                {
                    type: 'sphere',
                    position: [0, 0, 0],
                    scale: [1, 1, 1],
                    color: '#6366f1',
                    label: conceptName,
                },
            ],
        };
    }
}
