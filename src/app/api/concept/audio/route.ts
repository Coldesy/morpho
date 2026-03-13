// ============================================================
// /api/concept/audio
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateAudioDescription } from '@/lib/ai/audioExplainer';
import { ConceptAnalysis } from '@/types/types';

export async function POST(req: NextRequest) {
    try {
        const { concept } = await req.json();
        const typedConcept = concept as ConceptAnalysis;

        if (!typedConcept) {
            return NextResponse.json({ error: 'concept is required' }, { status: 400 });
        }

        const description = await generateAudioDescription(
            typedConcept.concept,
            typedConcept.components,
            typedConcept.structural_description
        );

        return NextResponse.json({ description });
    } catch {
        return NextResponse.json({ error: 'Failed to generate audio description' }, { status: 500 });
    }
}
