'use client';

interface ConfidenceMeterProps {
    score: number;
    size?: number;
    showLabel?: boolean;
}

function getConfidenceColor(score: number): string {
    if (score >= 0.8) return '#22c55e';
    if (score >= 0.6) return '#f59e0b';
    return '#ef4444';
}

function getConfidenceLabel(score: number): string {
    if (score >= 0.9) return 'Excellent Match';
    if (score >= 0.8) return 'Very Good Match';
    if (score >= 0.7) return 'Good Match';
    if (score >= 0.5) return 'Moderate Match';
    return 'Approximate';
}

export default function ConfidenceMeter({
    score,
    size = 64,
    showLabel = true,
}: ConfidenceMeterProps) {
    const percent = Math.round(score * 100);
    const r = (size / 2) - 6;
    const circumference = 2 * Math.PI * r;
    const offset = circumference - score * circumference;
    const color = getConfidenceColor(score);

    return (
        <div className="confidence-meter">
            <div className="confidence-ring" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <circle
                        className="confidence-ring-bg"
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                    />
                    <circle
                        className="confidence-ring-fill"
                        cx={size / 2}
                        cy={size / 2}
                        r={r}
                        stroke={color}
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                    />
                </svg>
                <div className="confidence-value" style={{ color }}>
                    {percent}%
                </div>
            </div>
            {showLabel && (
                <div className="confidence-details">
                    <div className="confidence-label">{getConfidenceLabel(score)}</div>
                    <div className="confidence-sublabel">AI Evaluation Score</div>
                </div>
            )}
        </div>
    );
}
