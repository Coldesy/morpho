'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import SearchBar from '@/components/SearchBar';
import InfoPanel from '@/components/InfoPanel';
import AccessibilityToolbar from '@/components/AccessibilityToolbar';
import PipelineProgressUI from '@/components/PipelineProgress';
import type { PipelineResult, PipelineStep, PipelineProgress } from '@/types/types';
import { GuidedStep } from '@/lib/ai/audioExplainer';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Dynamic import for Three.js viewer (SSR disabled)
const Viewer3D = dynamic(() => import('@/components/Viewer3D'), { ssr: false });

export default function HomePage() {
  const [result, setResult] = useState<PipelineResult | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [simplified, setSimplified] = useState(false);
  const [explodedView, setExplodedView] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [isolatedComponent, setIsolatedComponent] = useState<string | null>(null);
  
  const [tourSteps, setTourSteps] = useState<GuidedStep[] | null>(null);
  const [currentTourIndex, setCurrentTourIndex] = useState(-1);
  const [isTourPlaying, setIsTourPlaying] = useState(false);

  const [audioDescription, setAudioDescription] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [generatingTripo, setGeneratingTripo] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const timerIdsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // ─── High contrast mode ─────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('high-contrast', highContrast);
  }, [highContrast]);

  // ─── Shareable URLs ─────────────────────────────────
  useEffect(() => {
    const q = searchParams.get('q');
    if (q && !result && !loading && pipelineStep === null) {
      setQuery(q);
      handleSearch(q);
    }
  }, [searchParams]);

  // ─── Full pipeline search ─────────────────────────────────
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    abortRef.current?.abort();
    timerIdsRef.current.forEach(clearTimeout);
    timerIdsRef.current = [];

    const controller = new AbortController();
    abortRef.current = controller;

    setQuery(searchQuery);
    setLoading(true);
    setResult(null);
    setError(null);
    setAudioDescription(null);
    setRegenerating(false);
    setPipelineStep('analyzing');
    setIsTourPlaying(false);
    setTourSteps(null);

    // Update URL
    const params = new URLSearchParams(searchParams);
    params.set('q', searchQuery);
    router.replace(`/?${params.toString()}`);

    const scheduleStep = (step: PipelineStep, delayMs: number) => {
      const id = setTimeout(() => {
        if (!controller.signal.aborted) setPipelineStep(step);
      }, delayMs);
      timerIdsRef.current.push(id);
    };

    scheduleStep('searching', 3000);
    scheduleStep('validating', 7000);
    scheduleStep('generating', 12000);
    scheduleStep('rendering', 16000);

    try {
      const res = await fetch('/api/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
        signal: controller.signal,
      });

      timerIdsRef.current.forEach(clearTimeout);
      timerIdsRef.current = [];

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Pipeline failed (${res.status})`);
      }

      const data: PipelineResult = await res.json();
      setResult(data);
      setPipelineStep('complete');

      const doneId = setTimeout(() => setPipelineStep(null), 1200);
      timerIdsRef.current.push(doneId);
    } catch (err) {
      timerIdsRef.current.forEach(clearTimeout);
      timerIdsRef.current = [];

      if ((err as Error).name === 'AbortError') return;
      console.error('Pipeline error:', err);
      setError((err as Error).message);
      setPipelineStep('error');
      const errId = setTimeout(() => setPipelineStep(null), 3000);
      timerIdsRef.current.push(errId);
    }
  }, []);

  // ─── Regenerate with Tripo ────────────────────────────────
  const handleRegenerate = useCallback(async () => {
    if (!result || regenerating) return;
    setRegenerating(true);
    try {
      const res = await fetch('/api/models/fallback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: result.concept.concept,
          category: result.concept.category,
          components: result.concept.components,
          structural_description: result.concept.structural_description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult((prev) =>
          prev
            ? {
                ...prev,
                source: data.source,
                model_url: data.model_url ?? undefined,
                embed_url: undefined,
                model_uid: undefined,
                preview_url: undefined,
                primitiveConfig: data.primitiveConfig,
                confidence: data.confidence ?? (data.source === 'tripo' ? 0.78 : 0.45),
                explanation: data.explanation,
              }
            : prev
        );
      }
    } catch (err) {
      console.error('Regenerate error:', err);
    } finally {
      setRegenerating(false);
    }
  }, [result, regenerating]);

  // ─── Direct Tripo Generation ──────────────────────────────
  const handleGenerateTripo = useCallback(async () => {
    if (!result || generatingTripo) return;
    setGeneratingTripo(true);
    try {
      const res = await fetch('/api/models/tripo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: result.concept.concept,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResult((prev) =>
          prev
            ? {
                ...prev,
                source: data.source,
                model_url: data.model_url ?? undefined,
                embed_url: undefined,
                model_uid: undefined,
                preview_url: undefined,
                primitiveConfig: undefined,
                confidence: data.confidence,
                explanation: data.explanation,
              }
            : prev
        );
      }
    } catch (err) {
      console.error('Direct Tripo error:', err);
    } finally {
      setGeneratingTripo(false);
    }
  }, [result, generatingTripo]);

  // ─── Audio description (TTS) ──────────────────────────────
  const handleAudioDescription = useCallback(async () => {
    if (!result) return;
    if (audioDescription) {
      setAudioDescription(null);
      if ('speechSynthesis' in window) speechSynthesis.cancel();
      return;
    }

    setLoadingAudio(true);
    try {
      const res = await fetch('/api/accessibility/describe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concept: result.concept.concept,
          components: result.concept.components,
          structural_description: result.concept.structural_description,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAudioDescription(data.description);

        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(data.description);
          utterance.rate = 0.9;
          utterance.pitch = 1;
          speechSynthesis.speak(utterance);
        }
      }
    } catch (err) {
      console.error('Audio description error:', err);
    } finally {
      setLoadingAudio(false);
    }
  }, [result, audioDescription]);

  // Cleanup speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) speechSynthesis.cancel();
    };
  }, []);

  // ─── Accessibility Handlers ──────────────────────────────
  const toggleAudioDescription = async () => {
    if (loadingAudio || !result || !result.concept) return;
    
    // If it's already playing/generated, stop it
    if (audioDescription) {
        window.speechSynthesis.cancel();
        setAudioDescription(null);
        return;
    }

    setLoadingAudio(true);
    try {
        const res = await fetch('/api/concept/audio', {
            method: 'POST',
            body: JSON.stringify({ concept: result.concept })
        });
        const { description } = await res.json();
        setAudioDescription(description);
        
        const utterance = new SpeechSynthesisUtterance(description);
        utterance.onend = () => setAudioDescription(null);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
    } catch {
        // Handle error silently
    } finally {
        setLoadingAudio(false);
    }
  };

  // ─── Guided Tour Handlers ────────────────────────────────
  const playTourStep = (steps: GuidedStep[], index: number) => {
    if (index >= steps.length) {
      setIsolatedComponent(null);
      setTourSteps(null);
      setCurrentTourIndex(-1);
      setIsTourPlaying(false);
      return;
    }
    setCurrentTourIndex(index);
    setIsolatedComponent(steps[index].component);

    const utterance = new SpeechSynthesisUtterance(steps[index].narration);
    utterance.onend = () => {
      playTourStep(steps, index + 1);
    };
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const startGuidedTour = async () => {
    if (!result) return;
    setIsTourPlaying(true);
    try {
      const res = await fetch('/api/concept/guided', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ concept: result.concept }),
      });
      const steps = await res.json();
      setTourSteps(steps);
      playTourStep(steps, 0);
    } catch (err) {
      console.error('Guided tour error:', err);
      setIsTourPlaying(false);
    }
  };

  const stopGuidedTour = () => {
    window.speechSynthesis.cancel();
    setIsolatedComponent(null);
    setTourSteps(null);
    setCurrentTourIndex(-1);
    setIsTourPlaying(false);
  };

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span className="logo">Morpho</span>
          <span className="version">2.0</span>
        </div>
        <nav style={{ marginLeft: 'auto' }}>
          <Link href="/analytics" style={{ color: 'var(--text-secondary)', fontSize: '14px', textDecoration: 'none' }}>
            Analytics Dashboard ↗
          </Link>
        </nav>
        <SearchBar
          onSearch={handleSearch}
          disabled={
            (pipelineStep !== null &&
              pipelineStep !== 'complete' &&
              pipelineStep !== 'error') ||
            regenerating
          }
        />
      </header>

      {/* ─── Viewer ───────────────────────────────────────── */}
      <main className="viewer-area" role="main" aria-label="3D Visualization Area">
        {pipelineStep && pipelineStep !== 'complete' && pipelineStep !== 'error' && (
          <PipelineProgressUI step={pipelineStep} />
        )}

        {/* Regenerating spinner overlay */}
        {regenerating && (
          <div className="pipeline-overlay" style={{ background: 'rgba(10,10,15,0.7)' }}>
            <div style={{ fontSize: 64 }}>🤖</div>
            <div className="pipeline-message">Generating AI 3D model…</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 8 }}>
              Tripo AI is building your model (this can take 60–90 seconds)
            </div>
          </div>
        )}

        {error && !result && (
          <div className="viewer-placeholder">
            <div className="error-banner">⚠️ {error}</div>
          </div>
        )}

        {!result && !pipelineStep && !error && (
          <div className="viewer-placeholder">
            <div className="viewer-placeholder-icon">🧊</div>
            <h2>Explore Any Concept in 3D</h2>
            <p>
              Enter a concept like &quot;Human Heart&quot;, &quot;Solar System&quot;, or &quot;Taj Mahal&quot;
              to discover interactive 3D visualizations powered by AI.
            </p>
            <div className="morpho-badge">
              Powered by Morpho 2.0 — Multi-Model AI Engine
            </div>
          </div>
        )}

        {result && (
          <>
            <Viewer3D
              result={result}
              wireframe={wireframe}
              autoRotate={autoRotate}
              simplified={simplified}
              explodedView={explodedView}
              isolated={isolatedComponent}
              onIsolate={setIsolatedComponent}
            />
            <div className="viewer-controls">
              <button
                className={`viewer-ctrl-btn ${autoRotate ? 'active' : ''}`}
                onClick={() => setAutoRotate(!autoRotate)}
              >
                🔄 Auto Rotate
              </button>
              <button
                className={`viewer-ctrl-btn ${wireframe ? 'active' : ''}`}
                onClick={() => setWireframe(!wireframe)}
              >
                🔲 Wireframe
              </button>
              <button
                className={`viewer-ctrl-btn ${simplified ? 'active' : ''}`}
                onClick={() => setSimplified(!simplified)}
              >
                ⬡ Simplified
              </button>
              <button
                className={`viewer-ctrl-btn ${explodedView ? 'active' : ''}`}
                onClick={() => setExplodedView(!explodedView)}
              >
                💥 Exploded View
              </button>
              <button
                className="viewer-ctrl-btn"
                onClick={handleRegenerate}
                disabled={regenerating}
                title="Discard and re-generate using AI fallback"
                style={{
                  background: regenerating ? 'transparent' : 'rgba(139,92,246,0.15)',
                  borderColor: regenerating ? undefined : 'rgba(139,92,246,0.4)',
                  color: regenerating ? undefined : '#a78bfa',
                  opacity: regenerating ? 0.6 : 1,
                }}
              >
                {regenerating ? '⏳ Generating…' : '🤖 Generate with AI'}
              </button>
              <button
                className="viewer-ctrl-btn"
                onClick={handleGenerateTripo}
                disabled={generatingTripo}
                title="Force direct generation using Tripo AI"
                style={{
                  background: generatingTripo ? 'transparent' : 'rgba(16,185,129,0.15)',
                  borderColor: generatingTripo ? undefined : 'rgba(16,185,129,0.4)',
                  color: generatingTripo ? undefined : '#34d399',
                  opacity: generatingTripo ? 0.6 : 1,
                }}
              >
                {generatingTripo ? '⏳ Generating…' : '✨ Generate with Tripo'}
              </button>
            </div>
          </>
        )}
      </main>

      {/* ─── Side Panel ───────────────────────────────────── */}
      <aside className="side-panel" role="complementary" aria-label="Model Details Panel">
          <InfoPanel 
              result={result} 
              onStartTour={startGuidedTour}
              isTourPlaying={isTourPlaying}
          />
      </aside>

      {/* ─── Bottom Bar ───────────────────────────────────── */}
      <div className="bottom-bar">
        <AccessibilityToolbar
          hasResult={!!result}
          onAudioDescription={toggleAudioDescription}
          loadingAudio={loadingAudio}
          audioActive={!!audioDescription}
          simplified={simplified}
          onToggleSimplified={() => setSimplified(!simplified)}
          highContrast={highContrast}
          onToggleHighContrast={() => {
            setHighContrast(!highContrast);
            document.body.classList.toggle('high-contrast');
          }}
        />
        <div className="bottom-spacer" />
        {result && (
          <div className="pipeline-status">
            <span className="dot" />
            {result.source === 'sketchfab' && 'Sketchfab model loaded'}
            {result.source === 'tripo' && 'AI-generated model loaded'}
            {result.source === 'primitive' && 'Procedural model rendered'}
            {result.source === 'scene' && 'Text-to-Scene assembly generated'}
            {result.source === 'semantic_fallback' && 'Semantic fallback loaded'}
            {result.cached && ' · ⚡ Cached'}
            {result.pipeline_time_ms != null && (
              <span style={{ marginLeft: 8, opacity: 0.7 }}>
                {result.pipeline_time_ms < 1000
                  ? `${result.pipeline_time_ms}ms`
                  : `${(result.pipeline_time_ms / 1000).toFixed(1)}s`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ─── Audio Panel ──────────────────────────────────── */}
      {audioDescription && (
        <div className="audio-panel">
          <button className="audio-panel-close" onClick={() => setAudioDescription(null)}>
            ✕
          </button>
          <div className="audio-panel-title">🔊 Audio Description</div>
          <div className="audio-panel-text">{audioDescription}</div>
        </div>
      )}
    </div>
  );
}
