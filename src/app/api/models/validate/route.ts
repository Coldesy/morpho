// ============================================================
// POST /api/models/validate
// Step 3: AI model validation via Gemini
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { hybridValidate } from '@/lib/ai/modelValidator';
import { ConceptAnalysis, SketchfabModel } from '@/types/types';

export async function POST(req: NextRequest) {
    try {
        const { concept, category, components, candidates } = await req.json();

        if (!candidates || !Array.isArray(candidates) || candidates.length === 0) {
            return NextResponse.json({ validations: [] });
        }

        const conceptAnalysis: ConceptAnalysis = {
            concept: concept || '',
            category: category || 'object',
            components: components || [],
            structural_description: '',
            similar_objects: [],
            geometry_type: 'mixed',
            complexity: 'medium'
        };

        const hybridResults = await hybridValidate(
            conceptAnalysis,
            concept || '',
            candidates as SketchfabModel[]
        );

        const validations = hybridResults.map((res) => ({
            model_id: res.validation.model_id,
            final_score: res.composite_score,
            confidence: res.composite_score,
            reason: res.validation.explanation
        }));

        return NextResponse.json({ validations });
    } catch (err) {
        console.error('Validate error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Validation failed' },
            { status: 500 }
        );
    }
}
