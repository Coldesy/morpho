// ============================================================
// POST /api/models/search
// Step 2: Sketchfab model search
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { searchSketchfab } from '@/lib/sketchfab';

export async function POST(req: NextRequest) {
    try {
        const { concept, synonyms, similar_objects } = await req.json();

        // Build search queries from concept + synonyms + similar objects
        const queries: string[] = [concept];
        if (synonyms && Array.isArray(synonyms)) queries.push(...synonyms);
        if (similar_objects && Array.isArray(similar_objects)) queries.push(...similar_objects);

        // Deduplicate
        const uniqueQueries = [...new Set(queries.filter(Boolean))];

        const models = await searchSketchfab(uniqueQueries, 10);

        return NextResponse.json({ models });
    } catch (err) {
        console.error('Search error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Search failed' },
            { status: 500 }
        );
    }
}
