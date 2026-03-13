// ============================================================
// Sketchfab API helper
// ============================================================

import { SketchfabModel } from '@/types/types';

const SKETCHFAB_API = 'https://api.sketchfab.com/v3';

interface SketchfabSearchResult {
    uid: string;
    name: string;
    description: string;
    viewerUrl: string;
    embedUrl: string;
    thumbnails: { images: { url: string; width: number }[] };
    faceCount: number;
    tags: { name: string }[];
    user: { displayName: string };
    isDownloadable: boolean;
}

export async function searchSketchfab(
    queries: string[],
    maxResults = 10
): Promise<SketchfabModel[]> {
    const token = process.env.SKETCHFAB_API_TOKEN;
    if (!token) throw new Error('SKETCHFAB_API_TOKEN is not set');

    const allModels: SketchfabModel[] = [];
    const seenUids = new Set<string>();

    for (const query of queries) {
        if (allModels.length >= maxResults) break;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15_000);

        try {
            const url = new URL(`${SKETCHFAB_API}/search`);
            url.searchParams.set('type', 'models');
            url.searchParams.set('q', query);
            url.searchParams.set('sort_by', '-relevance');
            url.searchParams.set('count', String(Math.min(maxResults, 10)));

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Token ${token}` },
                signal: controller.signal,
            });

            if (!res.ok) continue;
            const data = await res.json();

            for (const r of (data.results ?? []) as SketchfabSearchResult[]) {
                if (seenUids.has(r.uid) || allModels.length >= maxResults) continue;
                seenUids.add(r.uid);

                // Get the best thumbnail
                const preview =
                    r.thumbnails?.images
                        ?.sort((a: { width: number }, b: { width: number }) => b.width - a.width)?.[0]
                        ?.url ?? '';

                allModels.push({
                    uid: r.uid,
                    name: r.name,
                    description: (r.description ?? '').slice(0, 500),
                    model_url: r.viewerUrl,
                    embed_url: r.embedUrl,
                    preview_url: preview,
                    polygon_count: r.faceCount ?? 0,
                    tags: r.tags?.map((t: { name: string }) => t.name) ?? [],
                    author: r.user?.displayName ?? 'Unknown',
                    is_downloadable: r.isDownloadable ?? false,
                });
            }
        } catch {
            // Continue with next query on failure
        } finally {
            clearTimeout(timeout);
        }
    }

    return allModels;
}
