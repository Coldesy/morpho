'use client';

import { PipelineStep } from '@/types/types';

interface PipelineProgressProps {
    step: PipelineStep;
}

const STEPS: { key: PipelineStep; icon: string; label: string }[] = [
    { key: 'analyzing', icon: '🧠', label: 'Analyze' },
    { key: 'searching', icon: '🔍', label: 'Search' },
    { key: 'validating', icon: '✅', label: 'Validate' },
    { key: 'generating', icon: '🎨', label: 'Generate' },
    { key: 'rendering', icon: '🖥️', label: 'Render' },
];

const MESSAGES: Record<string, string> = {
    analyzing: 'Understanding your concept with AI...',
    searching: 'Searching for 3D models...',
    validating: 'Hybrid AI validation in progress...',
    generating: 'Preparing 3D visualization...',
    rendering: 'Loading the viewer...',
};

export default function PipelineProgress({ step }: PipelineProgressProps) {
    const currentIdx = STEPS.findIndex((s) => s.key === step);

    return (
        <div className="pipeline-overlay">
            <div className="pipeline-steps">
                {STEPS.map((s, i) => (
                    <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            className={`pipeline-step ${i < currentIdx ? 'done' : i === currentIdx ? 'active' : ''
                                }`}
                        >
                            <div className="pipeline-step-icon">
                                {i < currentIdx ? '✓' : s.icon}
                            </div>
                            <div className="pipeline-step-label">{s.label}</div>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div
                                className={`pipeline-connector ${i < currentIdx ? 'done' : ''}`}
                            />
                        )}
                    </div>
                ))}
            </div>
            <div className="pipeline-message">
                {MESSAGES[step] ?? 'Processing...'}
            </div>
        </div>
    );
}
