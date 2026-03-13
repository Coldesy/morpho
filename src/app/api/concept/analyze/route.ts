// ============================================================
// POST /api/concept/analyze
// Step 1: Gemini concept understanding
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { callLLMWithJSON } from '@/lib/ai/llmClient';
import { supabase } from '@/lib/supabase';
import { ConceptAnalysis } from '@/types/types';

export async function POST(req: NextRequest) {
    try {
        const { query } = await req.json();
        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'query is required' }, { status: 400 });
        }

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

        const analysis = await callLLMWithJSON<ConceptAnalysis>(prompt);

        // Save to Supabase
        const { data: row, error } = await supabase
            .from('queries')
            .insert({
                query,
                concept_name: analysis.concept,
                concept_category: analysis.category,
                components: analysis.components,
                structural_description: analysis.structural_description,
                similar_objects: analysis.similar_objects,
                geometry_type: analysis.geometry_type,
                complexity: analysis.complexity,
            })
            .select('id')
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
        }

        return NextResponse.json({
            query_id: row?.id ?? null,
            analysis,
        });
    } catch (err) {
        console.error('Analyze error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Analysis failed' },
            { status: 500 }
        );
    }
}
