// ============================================================
// /api/concept/guided
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateGuidedNarration } from '@/lib/ai/audioExplainer';

export async function POST(req: NextRequest) {
    try {
        const { concept } = await req.json();
        if (!concept) {
            return NextResponse.json({ error: 'concept is required' }, { status: 400 });
        }

        const steps = await generateGuidedNarration(concept);
        return NextResponse.json(steps);
    } catch (e) {
        return NextResponse.json({ error: 'Failed to generate tour' }, { status: 500 });
    }
}
