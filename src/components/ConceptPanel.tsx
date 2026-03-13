'use client';

import { useState } from 'react';
import { EducationalBreakdown } from '@/types/types';

interface ConceptPanelProps {
    breakdown: EducationalBreakdown;
    conceptName: string;
    onStartTour?: () => void;
    isTourPlaying?: boolean;
}

export default function ConceptPanel({ breakdown, conceptName, onStartTour, isTourPlaying }: ConceptPanelProps) {
    const [activeTab, setActiveTab] = useState<'overview' | 'components' | 'how'>('overview');

    const tabs = [
        { key: 'overview' as const, label: '📖 Overview', icon: '📖' },
        { key: 'components' as const, label: '🔧 Parts', icon: '🔧' },
        { key: 'how' as const, label: '⚡ How It Works', icon: '⚡' },
    ];

    return (
        <div className="panel-section concept-panel">
            <div className="panel-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>🎓 Learn About {conceptName}</span>
                {onStartTour && (
                    <button 
                        onClick={onStartTour}
                        disabled={isTourPlaying}
                        style={{
                            background: isTourPlaying ? 'rgba(255,255,255,0.1)' : 'var(--accent-gradient)',
                            color: 'white',
                            border: 'none',
                            padding: '4px 12px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            cursor: isTourPlaying ? 'not-allowed' : 'pointer',
                            fontWeight: 600
                        }}
                    >
                        {isTourPlaying ? '🔊 Playing Tour...' : '▶ Start Guided Tour'}
                    </button>
                )}
            </div>

            {/* Tab Bar */}
            <div className="concept-tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        className={`concept-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="concept-tab-content">
                {activeTab === 'overview' && (
                    <div className="concept-section fade-in">
                        <p className="explanation-text">{breakdown.overview}</p>
                    </div>
                )}

                {activeTab === 'components' && (
                    <div className="concept-section fade-in">
                        {breakdown.components_explanation.map((comp, i) => (
                            <div key={i} className="concept-component">
                                <div className="concept-component-name">
                                    <span className="concept-component-dot" />
                                    {comp.name}
                                </div>
                                <div className="concept-component-desc">
                                    {comp.description}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'how' && (
                    <div className="concept-section fade-in">
                        <p className="explanation-text">{breakdown.how_it_works}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
