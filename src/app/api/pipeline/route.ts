// ============================================================
// POST /api/pipeline — Morpho 2.0 Pipeline Orchestrator
// Cache → Analyze → Search → Validate → Fallback → Render
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { analyzeConcept, generateEducationalBreakdown } from '@/lib/ai/conceptAnalyzer';
import { hybridValidate } from '@/lib/ai/modelValidator';
import { generateFallback } from '@/lib/ai/fallbackGenerator';
import { searchSketchfab } from '@/lib/sketchfab';
import { supabase } from '@/lib/supabase';
import { getCachedResult, setCachedResult } from '@/lib/cache';
import { logPipelineRun } from '@/lib/analytics';
import {
    PipelineResult,
    SketchfabModel,
} from '@/types/types';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
    const startTime = Date.now();

    try {
        const { query } = await req.json();
        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: 'query is required' }, { status: 400 });
        }

        // ─── Step 0: Cache Check ─────────────────────────────
        const cached = await getCachedResult(query);
        if (cached) {
            cached.pipeline_time_ms = Date.now() - startTime;

            // Log analytics
            logPipelineRun({
                query_id: cached.query_id,
                query,
                pipeline_time_ms: cached.pipeline_time_ms,
                source: cached.source,
                fallback_used: cached.source !== 'sketchfab',
                cached: true,
                confidence: cached.confidence,
            });

            return NextResponse.json(cached);
        }

        // ─── Step 1: Concept Analysis & Scene Check ────────────────
        const isParagraph = query.split(' ').length > 6 || query.length > 50;

        if (isParagraph) {
            const { generateScene } = await import('@/lib/ai/sceneGenerator');
            const sceneConfig = await generateScene(query);

            // Build pseudo concept
            const concept = {
                concept: 'Scene: ' + query.split(' ').slice(0, 4).join(' ') + '...',
                category: 'scene',
                components: sceneConfig.objects.map(o => o.name),
                structural_description: 'A multi-object 3D scene generated from text.',
                similar_objects: [],
                geometry_type: 'mixed',
                complexity: 'high'
            };

            const result: PipelineResult = {
                query_id: 'scene_' + Date.now(),
                concept,
                source: 'scene',
                confidence: 0.85,
                explanation: 'Generated a multi-object scene from the paragraph.',
                sceneConfig,
                pipeline_time_ms: Date.now() - startTime,
                cached: false
            };

            setCachedResult(query, result);

            // Analytics
            logPipelineRun({
                query_id: result.query_id,
                query,
                pipeline_time_ms: result.pipeline_time_ms!,
                source: result.source,
                fallback_used: true,
                cached: false,
                confidence: result.confidence,
            });

            return NextResponse.json(result);
        }

        const concept = await analyzeConcept(query);

        // Save query to Supabase
        let queryId: string | null = null;
        try {
            const { data: row } = await supabase
                .from('queries')
                .insert({
                    query,
                    concept_name: concept.concept,
                    concept_category: concept.category,
                    components: concept.components,
                    structural_description: concept.structural_description,
                    similar_objects: concept.similar_objects,
                    geometry_type: concept.geometry_type,
                    complexity: concept.complexity,
                })
                .select('id')
                .single();
            queryId = row?.id ?? null;
        } catch (e) {
            console.error('Supabase query insert error:', e);
        }

        // Generate educational breakdown (non-blocking — we await at the end)
        const educationalPromise = generateEducationalBreakdown(concept);

        // ─── Step 2: Sketchfab Search ────────────────────────
        const scientificCategories = ['biological', 'geological', 'chemical', 'mechanical', 'structure', 'celestial', 'scientific'];
        const isScientific = scientificCategories.some(cat => concept.category.toLowerCase().includes(cat));

        const searchTerms = [
            concept.concept,
            ...(isScientific ? [`${concept.concept} scientific model`, `${concept.concept} educational`, `${concept.concept} diagram`, `${concept.concept} anatomy`] : []),
            ...concept.similar_objects.slice(0, 2),
        ];

        let sketchfabModels: SketchfabModel[] = [];
        try {
            sketchfabModels = await searchSketchfab(searchTerms, 10);
        } catch (e) {
            console.error('Sketchfab search error:', e);
        }

        // ─── Step 3: Hybrid AI Validation ────────────────────
        let result: PipelineResult;

        if (sketchfabModels.length > 0) {
            const validationResults = await hybridValidate(concept, query, sketchfabModels);

            const best = validationResults[0];
            if (best && best.composite_score >= 0.7) {
                result = {
                    query_id: queryId ?? '',
                    concept,
                    source: 'sketchfab',
                    model_url: best.model.model_url,
                    model_uid: best.model.uid,
                    embed_url: best.model.embed_url,
                    preview_url: best.model.preview_url,
                    confidence: best.composite_score,
                    explanation: best.validation.explanation,
                    author: best.model.author,
                    polygon_count: best.model.polygon_count,
                    tags: best.model.tags,
                };
            } else {
                // Name-based heuristic fallback
                const conceptLower = concept.concept.toLowerCase();
                const negativeKeywords = ['panorama', 'hdri', 'skybox', '360'];
                
                const nameMatch = sketchfabModels.find((m) => {
                    const nameLower = m.name.toLowerCase();
                    const hasNegative = negativeKeywords.some(key => nameLower.includes(key));
                    if (hasNegative) return false;
                    
                    return nameLower.includes(conceptLower) || conceptLower.includes(nameLower);
                });

                if (nameMatch) {
                    const matchValidation = validationResults.find(
                        (v) => v.model.uid === nameMatch.uid
                    );
                    result = {
                        query_id: queryId ?? '',
                        concept,
                        source: 'sketchfab',
                        model_url: nameMatch.model_url,
                        model_uid: nameMatch.uid,
                        embed_url: nameMatch.embed_url,
                        preview_url: nameMatch.preview_url,
                        confidence: matchValidation?.composite_score ?? 0.6,
                        explanation: matchValidation?.validation.explanation ??
                            `Model name matches "${concept.concept}".`,
                        author: nameMatch.author,
                        polygon_count: nameMatch.polygon_count,
                        tags: nameMatch.tags,
                    };
                } else {
                    // No good Sketchfab match — go to fallback
                    const fallback = await generateFallback(concept);
                    result = {
                        query_id: queryId ?? '',
                        concept,
                        source: fallback.source,
                        model_url: fallback.model_url,
                        confidence: fallback.confidence,
                        explanation: fallback.explanation,
                        primitiveConfig: fallback.primitiveConfig,
                    };
                }
            }
        } else {
            // ─── Step 4: Fallback ────────────────────────────
            const fallback = await generateFallback(concept);
            result = {
                query_id: queryId ?? '',
                concept,
                source: fallback.source,
                model_url: fallback.model_url,
                confidence: fallback.confidence,
                explanation: fallback.explanation,
                primitiveConfig: fallback.primitiveConfig,
            };
        }

        // Attach educational breakdown
        try {
            result.educational_breakdown = await educationalPromise;
        } catch {
            // Non-critical
        }

        // Calculate pipeline time
        result.pipeline_time_ms = Date.now() - startTime;
        result.cached = false;

        // Save model to Supabase
        if (queryId) {
            try {
                await supabase.from('models').insert({
                    query_id: queryId,
                    source: result.source,
                    model_url: result.model_url ?? null,
                    model_uid: result.model_uid ?? null,
                    preview_url: result.preview_url ?? null,
                    confidence: result.confidence,
                    relevance_score: result.confidence,
                    explanation: result.explanation,
                    polygon_count: result.polygon_count ?? null,
                    tags: result.tags ?? null,
                    author: result.author ?? null,
                });
            } catch (e) {
                console.error('Supabase model insert error:', e);
            }
        }

        // Cache the result
        setCachedResult(query, result);

        // Log analytics (fire-and-forget)
        logPipelineRun({
            query_id: queryId ?? '',
            query,
            pipeline_time_ms: result.pipeline_time_ms,
            source: result.source,
            fallback_used: result.source !== 'sketchfab',
            cached: false,
            confidence: result.confidence,
        });

        return NextResponse.json(result);
    } catch (err) {
        console.error('Pipeline error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Pipeline failed' },
            { status: 500 }
        );
    }
}
