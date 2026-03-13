// ============================================================
// /api/models/tripo
// Direct generation with Tripo AI bypassing fallbacks
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { generateTripoModel } from '@/lib/tripo';

export async function POST(req: NextRequest) {
    try {
        const { concept } = await req.json();

        if (!concept) {
            return NextResponse.json(
                { error: 'Concept name is required' },
                { status: 400 }
            );
        }

        console.log(`[API] Starting direct Tripo generation for: ${concept}`);

        // Direct call to Tripo AI
        const tripoResultModelUrl = await generateTripoModel(concept);
        
        if (tripoResultModelUrl) {
            return NextResponse.json({
                source: 'tripo',
                model_url: tripoResultModelUrl,
                confidence: 0.8, // Fixed confidence for direct explicit tripo generations
                explanation: `This is a 3D model generated directly using Tripo AI from the concept name '${concept}'.`
            });
        }

        return NextResponse.json(
            { error: 'Failed to generate model directly with Tripo' },
            { status: 500 }
        );

    } catch (err: any) {
        console.error('Direct Tripo API Error:', err);
        return NextResponse.json(
            { error: err.message || 'Direct Tripo generation failed' },
            { status: 500 }
        );
    }
}
