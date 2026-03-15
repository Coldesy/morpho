// ============================================================
// Morpho 2.0 — Supabase Cache Layer
// Checks concept_cache before running pipeline
// ============================================================

import { supabase } from './supabase';
import { PipelineResult } from '@/types/types';

/**
 * Normalize a query for cache matching.
 * Lowercases, trims, and removes extra whitespace.
 */
function normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Check the cache for a matching query.
 * Returns the cached PipelineResult or null.
 */
export async function getCachedResult(query: string): Promise<PipelineResult | null> {
    try {
        const normalized = normalizeQuery(query);

        const { data, error } = await supabase
            .from('concept_cache')
            .select('*')
            .eq('query', normalized)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return null;

        // Parse the stored JSON result
        const result: PipelineResult = {
            query_id: data.query_id ?? '',
            concept: typeof data.analysis_json === 'string'
                ? JSON.parse(data.analysis_json)
                : data.analysis_json,
            source: data.source ?? 'sketchfab',
            model_url: data.best_model_url ?? undefined,
            model_uid: data.model_uid ?? undefined,
            embed_url: data.embed_url ?? undefined,
            preview_url: data.preview_url ?? undefined,
            confidence: data.confidence ?? 0.5,
            explanation: data.explanation ?? '',
            author: data.author ?? undefined,
            polygon_count: data.polygon_count ?? undefined,
            tags: data.tags ?? undefined,
            primitiveConfig: data.primitive_config
                ? (typeof data.primitive_config === 'string'
                    ? JSON.parse(data.primitive_config)
                    : data.primitive_config)
                : undefined,
            educational_breakdown: data.educational_breakdown
                ? (typeof data.educational_breakdown === 'string'
                    ? JSON.parse(data.educational_breakdown)
                    : data.educational_breakdown)
                : undefined,
            cached: true,
        };

        return result;
    } catch (err) {
        console.error('Cache lookup error:', err);
        return null;
    }
}

/**
 * Store a pipeline result in the cache.
 */
export async function setCachedResult(
    query: string,
    result: PipelineResult
): Promise<void> {
    try {
        const normalized = normalizeQuery(query);

        await supabase.from('concept_cache').upsert(
            {
                query: normalized,
                query_id: result.query_id,
                analysis_json: result.concept,
                best_model_url: result.model_url ?? null,
                model_uid: result.model_uid ?? null,
                embed_url: result.embed_url ?? null,
                preview_url: result.preview_url ?? null,
                confidence: result.confidence,
                source: result.source,
                explanation: result.explanation,
                author: result.author ?? null,
                polygon_count: result.polygon_count ?? null,
                tags: result.tags ?? null,
                primitive_config: result.primitiveConfig ?? null,
                educational_breakdown: result.educational_breakdown ?? null,
                created_at: new Date().toISOString(),
            },
            { onConflict: 'query' }
        );
    } catch (err) {
        console.error('Cache store error:', err);
    }
}



export const DEMO_QUERIES = [
    'Human Heart',
    'Solar System',
    'Taj Mahal',
    'Volcano',
];
