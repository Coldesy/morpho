// ============================================================
// Morpho 2.0 — Analytics Tracking
// Logs pipeline metrics to Supabase analytics table
// ============================================================

import { supabase } from './supabase';
import { ModelSource } from '@/types/types';

/**
 * Log a pipeline run to the analytics table.
 */
export async function logPipelineRun(params: {
    query_id: string;
    query: string;
    pipeline_time_ms: number;
    source: ModelSource;
    fallback_used: boolean;
    cached: boolean;
    confidence: number;
}): Promise<void> {
    try {
        await supabase.from('analytics').insert({
            query_id: params.query_id,
            query: params.query,
            pipeline_time_ms: params.pipeline_time_ms,
            source: params.source,
            fallback_used: params.fallback_used,
            cached: params.cached,
            confidence: params.confidence,
            created_at: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Analytics log error:', err);
    }
}

export interface AnalyticsSummary {
    total_queries: number;
    success_rate: number;
    avg_pipeline_time_ms: number;
    source_breakdown: Record<string, number>;
    fallback_rate: number;
    cache_hit_rate: number;
}

/**
 * Get an analytics summary.
 */
export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
    try {
        const { data, error } = await supabase
            .from('analytics')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(500);

        if (error || !data || data.length === 0) {
            return {
                total_queries: 0,
                success_rate: 0,
                avg_pipeline_time_ms: 0,
                source_breakdown: {},
                fallback_rate: 0,
                cache_hit_rate: 0,
            };
        }

        const total = data.length;
        const successful = data.filter((d) => d.confidence > 0.3).length;
        const avgTime =
            data.reduce((sum, d) => sum + (d.pipeline_time_ms ?? 0), 0) / total;
        const fallbacks = data.filter((d) => d.fallback_used).length;
        const cached = data.filter((d) => d.cached).length;

        const sourceBreakdown: Record<string, number> = {};
        for (const d of data) {
            const src = d.source ?? 'unknown';
            sourceBreakdown[src] = (sourceBreakdown[src] ?? 0) + 1;
        }

        return {
            total_queries: total,
            success_rate: successful / total,
            avg_pipeline_time_ms: Math.round(avgTime),
            source_breakdown: sourceBreakdown,
            fallback_rate: fallbacks / total,
            cache_hit_rate: cached / total,
        };
    } catch {
        return {
            total_queries: 0,
            success_rate: 0,
            avg_pipeline_time_ms: 0,
            source_breakdown: {},
            fallback_rate: 0,
            cache_hit_rate: 0,
        };
    }
}
