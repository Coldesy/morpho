'use client';

interface AccessibilityToolbarProps {
    hasResult: boolean;
    onAudioDescription: () => void;
    loadingAudio: boolean;
    audioActive: boolean;
    simplified: boolean;
    onToggleSimplified: () => void;
    highContrast?: boolean;
    onToggleHighContrast?: () => void;
}

export default function AccessibilityToolbar({
    hasResult,
    onAudioDescription,
    loadingAudio,
    audioActive,
    simplified,
    onToggleSimplified,
    highContrast,
    onToggleHighContrast,
}: AccessibilityToolbarProps) {
    return (
        <>
            <button
                className={`a11y-btn ${audioActive ? 'active' : ''}`}
                onClick={onAudioDescription}
                disabled={!hasResult || loadingAudio}
                title="Generate spoken description of the 3D model"
                aria-label={audioActive ? 'Stop audio description' : 'Play audio description'}
            >
                {loadingAudio ? '⏳' : '🔊'} Audio Description
            </button>
            <button
                className={`a11y-btn ${simplified ? 'active' : ''}`}
                onClick={onToggleSimplified}
                disabled={!hasResult}
                title="Toggle simplified low-poly mode"
                aria-label={simplified ? 'Disable simplified view' : 'Enable simplified view'}
            >
                ⬡ Simplified View
            </button>
            {onToggleHighContrast && (
                <button
                    className={`a11y-btn ${highContrast ? 'active' : ''}`}
                    onClick={onToggleHighContrast}
                    title="Toggle high contrast mode"
                    aria-label={highContrast ? 'Disable high contrast' : 'Enable high contrast'}
                >
                    🔲 High Contrast
                </button>
            )}
        </>
    );
}
