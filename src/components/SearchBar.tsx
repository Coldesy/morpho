'use client';

import { useState, useCallback, KeyboardEvent } from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
    disabled?: boolean;
}

const SUGGESTIONS = [
    'Human Heart',
    'Solar System',
    'Taj Mahal',
    'Volcano',
    'DNA Helix',
    'Atom',
    'Tree',
    'Brain',
    'Eiffel Tower',
    'Red Blood Cell',
];

// Demo concepts that should load instantly from cache
const DEMO_CONCEPTS = ['Human Heart', 'Solar System', 'Taj Mahal', 'Volcano'];

export default function SearchBar({ onSearch, disabled }: SearchBarProps) {
    const [query, setQuery] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSubmit = useCallback(() => {
        const trimmed = query.trim();
        if (trimmed && !disabled) {
            onSearch(trimmed);
            setShowSuggestions(false);
        }
    }, [query, disabled, onSearch]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleSubmit();
        },
        [handleSubmit]
    );

    const handleSuggestionClick = useCallback(
        (suggestion: string) => {
            setQuery(suggestion);
            setShowSuggestions(false);
            onSearch(suggestion);
        },
        [onSearch]
    );

    const isDemo = (s: string) => DEMO_CONCEPTS.includes(s);

    return (
        <div className="search-container">
            <div className="search-wrapper">
                <input
                    id="concept-search"
                    type="text"
                    className="search-input"
                    placeholder="Explore any concept in 3D... (e.g., Human Heart, Solar System)"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setShowSuggestions(e.target.value.length === 0);
                    }}
                    onFocus={() => {
                        if (query.length === 0) setShowSuggestions(true);
                    }}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    aria-label="Search concepts for 3D visualization"
                />
                <button
                    className="search-btn"
                    onClick={handleSubmit}
                    disabled={disabled || !query.trim()}
                    aria-label="Search"
                >
                    {disabled ? '⏳' : '→'}
                </button>
            </div>

            {showSuggestions && (
                <div
                    style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: '8px',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--radius-md)',
                        padding: '8px',
                        zIndex: 50,
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '6px',
                    }}
                >
                    <div
                        style={{
                            width: '100%',
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            padding: '4px 8px',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                        }}
                    >
                        Try these concepts
                    </div>
                    {SUGGESTIONS.map((s) => (
                        <button
                            key={s}
                            onClick={() => handleSuggestionClick(s)}
                            className={`suggestion-chip ${isDemo(s) ? 'demo' : ''}`}
                            style={{
                                padding: '6px 12px',
                                background: isDemo(s)
                                    ? 'rgba(99, 102, 241, 0.15)'
                                    : 'var(--bg-tertiary)',
                                border: `1px solid ${isDemo(s) ? 'rgba(99, 102, 241, 0.3)' : 'var(--border-glass)'}`,
                                borderRadius: 'var(--radius-sm)',
                                color: isDemo(s) ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                                fontSize: '13px',
                                cursor: 'pointer',
                                fontFamily: 'Inter, sans-serif',
                                transition: 'all 0.2s ease',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                            }}
                            onMouseEnter={(e) => {
                                (e.target as HTMLElement).style.background = 'var(--accent-primary)';
                                (e.target as HTMLElement).style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                (e.target as HTMLElement).style.background = isDemo(s)
                                    ? 'rgba(99, 102, 241, 0.15)'
                                    : 'var(--bg-tertiary)';
                                (e.target as HTMLElement).style.color = isDemo(s)
                                    ? 'var(--accent-secondary)'
                                    : 'var(--text-secondary)';
                            }}
                        >
                            {isDemo(s) && <span style={{ fontSize: '10px' }}>⚡</span>}
                            {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
