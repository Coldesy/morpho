'use client';

import { PipelineResult } from '@/types/types';
import ConfidenceMeter from './ConfidenceMeter';
import ConceptPanel from './ConceptPanel';

interface InfoPanelProps {
    result: PipelineResult | null;
    onStartTour?: () => void;
    isTourPlaying?: boolean;
}

export default function InfoPanel({ result, onStartTour, isTourPlaying }: InfoPanelProps) {
    if (!result) {
        return (
            <div className="panel-empty">
                <div className="panel-empty-icon">📊</div>
                <h3>Model Details</h3>
                <p>
                    Search for a concept to see model information, confidence scores, and
                    AI explanations here.
                </p>
            </div>
        );
    }

    return (
        <>
            {/* ─── Pipeline Info ───────────────────────────── */}
            {(result.cached || result.pipeline_time_ms) && (
                <div className="panel-section">
                    <div className="panel-section-title">Pipeline</div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        {result.cached && (
                            <span className="source-badge cached">⚡ Cached</span>
                        )}
                        {result.pipeline_time_ms != null && (
                            <span style={{
                                fontSize: '12px',
                                color: 'var(--text-muted)',
                            }}>
                                {result.pipeline_time_ms < 1000
                                    ? `${result.pipeline_time_ms}ms`
                                    : `${(result.pipeline_time_ms / 1000).toFixed(1)}s`}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* ─── Confidence ──────────────────────────────── */}
            <div className="panel-section">
                <div className="panel-section-title">Confidence</div>
                <ConfidenceMeter score={result.confidence} />
            </div>

            {/* ─── Source ───────────────────────────────────── */}
            <div className="panel-section">
                <div className="panel-section-title">Source</div>
                <span className={`source-badge ${result.source}`}>
                    {result.source === 'sketchfab' && '🎯 Sketchfab'}
                    {result.source === 'tripo' && '🤖 AI Generated'}
                    {result.source === 'primitive' && '🔷 Procedural'}
                    {result.source === 'semantic_fallback' && '🔄 Semantic Fallback'}
                </span>
                {result.author && (
                    <div className="model-detail-row" style={{ marginTop: '12px' }}>
                        <span className="model-detail-label">Author</span>
                        <span className="model-detail-value">{result.author}</span>
                    </div>
                )}
                {result.polygon_count != null && result.polygon_count > 0 && (
                    <div className="model-detail-row">
                        <span className="model-detail-label">Polygons</span>
                        <span className="model-detail-value">
                            {result.polygon_count.toLocaleString()}
                        </span>
                    </div>
                )}
            </div>

            {/* ─── Explanation ─────────────────────────────── */}
            <div className="panel-section">
                <div className="panel-section-title">AI Explanation</div>
                <div className="explanation-text">{result.explanation}</div>
            </div>

            {/* ─── Educational Breakdown ──────────────────── */}
            {result.educational_breakdown && (
                <ConceptPanel
                    breakdown={result.educational_breakdown}
                    conceptName={result.concept.concept}
                    onStartTour={onStartTour}
                    isTourPlaying={isTourPlaying}
                />
            )}

            {/* ─── Concept Breakdown ───────────────────────── */}
            <div className="panel-section">
                <div className="panel-section-title">Concept Breakdown</div>
                <div className="model-detail-row">
                    <span className="model-detail-label">Category</span>
                    <span className="model-detail-value">
                        {result.concept.category}
                    </span>
                </div>
                <div className="model-detail-row">
                    <span className="model-detail-label">Geometry</span>
                    <span className="model-detail-value">
                        {result.concept.geometry_type}
                    </span>
                </div>
                <div className="model-detail-row">
                    <span className="model-detail-label">Complexity</span>
                    <span className="model-detail-value">
                        {result.concept.complexity}
                    </span>
                </div>
            </div>

            {/* ─── Components ──────────────────────────────── */}
            {result.concept.components?.length > 0 && (
                <div className="panel-section">
                    <div className="panel-section-title">Components</div>
                    <ul className="component-list">
                        {result.concept.components.map((c) => (
                            <li key={c} className="component-tag">
                                {c}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* ─── Tags ────────────────────────────────────── */}
            {result.tags && result.tags.length > 0 && (
                <div className="panel-section">
                    <div className="panel-section-title">Tags</div>
                    <ul className="component-list">
                        {result.tags.slice(0, 12).map((t) => (
                            <li key={t} className="component-tag">
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
}
