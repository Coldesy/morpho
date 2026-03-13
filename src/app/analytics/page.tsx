// ============================================================
// /analytics
// Morpho 2.0 — Analytics Dashboard
// ============================================================

import { getAnalyticsSummary } from '@/lib/analytics';
import Link from 'next/link';

export const revalidate = 60; // Revalidate every minute

export default async function AnalyticsPage() {
    const summary = await getAnalyticsSummary();

    return (
        <div className="app-container" style={{ overflowY: 'auto' }}>
            <header className="header">
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span className="logo">Morpho</span>
                    <span className="version">2.0 / Analytics</span>
                </div>
                <nav className="header-nav">
                    <Link href="/" className="nav-link">← Back to Explorer</Link>
                </nav>
            </header>
            <main style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', color: 'var(--text-primary)' }}>
                <h1 style={{ fontWeight: 600, fontSize: '2rem', marginBottom: '2rem' }}>Pipeline Analytics</h1>
                
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                    gap: '1.5rem', 
                    marginBottom: '3rem'
                }}>
                    <div className="panel-section" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Total Queries</div>
                        <div style={{ fontSize: '32px', fontWeight: 600 }}>{summary.total_queries}</div>
                    </div>
                    <div className="panel-section" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Success Rate</div>
                        <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--accent-green, #34d399)' }}>
                            {(summary.success_rate * 100).toFixed(1)}%
                        </div>
                    </div>
                    <div className="panel-section" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Avg Time</div>
                        <div style={{ fontSize: '32px', fontWeight: 600 }}>{summary.avg_pipeline_time_ms}ms</div>
                    </div>
                    <div className="panel-section" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Cache Hit Rate</div>
                        <div style={{ fontSize: '32px', fontWeight: 600, color: 'var(--accent-blue)' }}>
                            {(summary.cache_hit_rate * 100).toFixed(1)}%
                        </div>
                    </div>
                    <div className="panel-section" style={{ background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '8px' }}>AI Fallback Rate</div>
                        <div style={{ fontSize: '32px', fontWeight: 600, color: '#fbbf24' }}>
                            {(summary.fallback_rate * 100).toFixed(1)}%
                        </div>
                    </div>
                </div>

                <h2 style={{ fontWeight: 600, fontSize: '1.5rem', marginBottom: '1rem' }}>Source Breakdown</h2>
                <div className="panel-section" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    {Object.entries(summary.source_breakdown).map(([source, count]) => (
                        <div key={source} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                            <span style={{ textTransform: 'capitalize', fontWeight: 500 }}>{source}</span>
                            <span style={{ fontWeight: 600, color: 'var(--accent-blue)' }}>{count}</span>
                        </div>
                    ))}
                    {Object.keys(summary.source_breakdown).length === 0 && (
                        <div style={{ color: 'var(--text-muted)' }}>No data yet.</div>
                    )}
                </div>
            </main>
        </div>
    );
}
