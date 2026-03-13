// ============================================================
// Morpho 2.0 — Semantic Search & Embedding Utilities
// Primary: Jina Embeddings v2 API
// Fallback: Simple TF-IDF-like cosine similarity
// ============================================================

import { SketchfabModel } from '@/types/types';

const JINA_API_URL = 'https://api.jina.ai/v1/embeddings';

/**
 * Get embedding from Jina Embeddings API.
 * Returns null if API key is missing or request fails.
 */
async function getJinaEmbedding(text: string): Promise<number[] | null> {
    const apiKey = process.env.JINA_API_KEY;
    if (!apiKey) return null;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10_000);

        const res = await fetch(JINA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'jina-embeddings-v2-base-en',
                input: [text],
            }),
            signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!res.ok) return null;
        const data = await res.json();
        return data.data?.[0]?.embedding ?? null;
    } catch {
        return null;
    }
}

/**
 * Compute cosine similarity between two vectors.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length || a.length === 0) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    return magnitude === 0 ? 0 : dotProduct / magnitude;
}

/**
 * Simple word-overlap similarity (TF-IDF-like fallback).
 * Returns a score between 0 and 1.
 */
function wordOverlapSimilarity(query: string, text: string): number {
    const normalize = (s: string) =>
        s.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);

    const queryWords = new Set(normalize(query));
    const textWords = normalize(text);

    if (queryWords.size === 0 || textWords.length === 0) return 0;

    let matches = 0;
    for (const word of textWords) {
        if (queryWords.has(word)) matches++;
    }

    // Jaccard-like score
    const union = new Set([...queryWords, ...textWords]);
    return matches / union.size;
}

/**
 * Score a single model against a query using semantic similarity.
 * Uses Jina embeddings if available, falls back to word overlap.
 */
async function scoreModelSemantic(
    queryEmbedding: number[] | null,
    query: string,
    model: SketchfabModel
): Promise<number> {
    const modelText = [
        model.name,
        model.description?.slice(0, 300) ?? '',
        ...(model.tags ?? []),
    ].join(' ');

    // Try embedding-based similarity
    if (queryEmbedding) {
        const modelEmbedding = await getJinaEmbedding(modelText);
        if (modelEmbedding) {
            return cosineSimilarity(queryEmbedding, modelEmbedding);
        }
    }

    // Fallback: word overlap
    return wordOverlapSimilarity(query, modelText);
}

export interface SemanticScore {
    model_uid: string;
    semantic_similarity: number;
}

/**
 * Score all models against a query using semantic similarity.
 * Returns scores sorted descending.
 */
export async function scoreModels(
    query: string,
    models: SketchfabModel[]
): Promise<SemanticScore[]> {
    // Get query embedding once
    const queryEmbedding = await getJinaEmbedding(query);

    const scores: SemanticScore[] = [];

    for (const model of models) {
        const similarity = await scoreModelSemantic(queryEmbedding, query, model);
        scores.push({
            model_uid: model.uid,
            semantic_similarity: similarity,
        });
    }

    // Sort descending
    scores.sort((a, b) => b.semantic_similarity - a.semantic_similarity);
    return scores;
}
