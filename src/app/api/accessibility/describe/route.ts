// ============================================================
// POST /api/accessibility/describe — Morpho 2.0
// AI-powered audio description using multi-LLM layer
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateAudioDescription } from '@/lib/ai/audioExplainer';

export async function POST(req: NextRequest) {
    try {
        const { concept, components, structural_description } = await req.json();

        const description = await generateAudioDescription(
            concept,
            components ?? [],
            structural_description ?? ''
        );

        return NextResponse.json({ description });
    } catch (err) {
        console.error('Describe error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Description generation failed' },
            { status: 500 }
        );
    }
}
