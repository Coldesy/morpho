// ============================================================
// GET /api/analytics — Morpho 2.0
// Returns pipeline analytics summary
// ============================================================

import { NextResponse } from 'next/server';
import { getAnalyticsSummary } from '@/lib/analytics';

export async function GET() {
    try {
        const summary = await getAnalyticsSummary();
        return NextResponse.json(summary);
    } catch (err) {
        console.error('Analytics error:', err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : 'Analytics failed' },
            { status: 500 }
        );
    }
}
