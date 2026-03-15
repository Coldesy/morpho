// ============================================================
// POST /api/models/fallback — Morpho 2.0
// Multi-mode fallback: Tripo → Semantic Substitution → Primitives
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateFallback } from '@/lib/ai/fallbackGenerator';
import { ConceptAnalysis } from '@/types/types';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    try {
        const { concept, category, components, structural_description } = await req.json();

        const conceptAnalysis: ConceptAnalysis = {
            concept: concept ?? 'Unknown',
            category: category ?? 'object',
            components: components ?? [],
            structural_description: structural_description ?? '',
            similar_objects: [],
            geometry_type: 'mixed',
            complexity: 'medium',
        };

        const result = await generateFallback(conceptAnalysis);

        return NextResponse.json({
            source: result.source,
            model_url: result.model_url,
            primitiveConfig: result.primitiveConfig,
            explanation: result.explanation,
            confidence: result.confidence,
        });
    } catch (err) {
        console.error('Fallback error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Fallback generation failed' },
            { status: 500 }
        );
    }
}
