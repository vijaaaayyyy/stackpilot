'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  Scale,
  ShieldAlert,
  Sparkles,
  Video,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { SnickMeter } from '@/components/review/snick-meter';
import { onFieldFor, reasonFor } from '@/lib/drs/demo-service';
import { analyzeDelivery, type DrsAnalysis } from '@/lib/drs/ai';
import { saveReview } from '@/lib/drs/store';
import { deleteClip, getClip, resolveClipUrl, type ReviewClip } from '@/lib/drs/clips';
import { analyzeClipAudio, type ClipAudio } from '@/lib/drs/audio';
import type { Decision, Review, ReviewEvidence, ReviewTypeId } from '@/lib/drs/types';
import { cn } from '@/lib/utils';

const DrsScene = dynamic(
  () => import('@/components/review/drs-scene').then((module) => module.DrsScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-lg border border-white/10 bg-[#07120d]">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          Loading tracking…
        </span>
      </div>
    ),
  },
);

const SPEEDS = [0.25, 0.5, 1, 2] as const;
const FRAME_SEC = 1 / 30;

function normalizeType(type: string): ReviewTypeId {
  const t = (type || 'lbw').toLowerCase().replace('run-out', 'runout');
  const valid: ReviewTypeId[] = ['lbw', 'caught', 'runout', 'stumping', 'boundary'];
  return (valid.includes(t as ReviewTypeId) ? t : 'lbw') as ReviewTypeId;
}

function reviewLabel(type: ReviewTypeId): string {
  const map: Record<ReviewTypeId, string> = {
    lbw: 'LBW REVIEW',
    caught: 'CAUGHT BEHIND',
    runout: 'RUN OUT',
    stumping: 'STUMPING',
    boundary: 'BOUNDARY',
  };
  return map[type];
}

function formatTime(seconds: number): string {
  const total = Math.max(0, Math.round(seconds * 1000));
  const ms = String(total % 1000).padStart(3, '0');
  const s = Math.floor(total / 1000) % 60;
  const m = Math.floor(total / 60000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
}

const DEFAULT_DECISION: Record<ReviewTypeId, Decision> = {
  lbw: 'OUT',
  caught: 'OUT',
  runout: 'OUT',
  stumping: 'OUT',
  boundary: 'NOT OUT',
};

function deriveStatus(onField: Decision | 'SIX', decision: Decision): Review['status'] {
  if (decision === 'INCONCLUSIVE') return 'INCONCLUSIVE';
  return onField === 'OUT' === (decision === 'OUT') ? 'UPHELD' : 'OVERTURNED';
}

export function ReviewWorkstation({
  type,
  clipId,
  from = 'upload',
}: {
  type: string;
  clipId: string;
  from?: 'live' | 'history' | 'demo' | 'upload';
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const [reviewType, setReviewType] = useState<ReviewTypeId>(() => normalizeType(type));
  const [evidence, setEvidence] = useState<ReviewEvidence | null>(null);
  const [decision, setDecision] = useState<Decision>(DEFAULT_DECISION[normalizeType(type)]);
  const [returning, setReturning] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<DrsAnalysis | null>(null);
  const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'done'>('idle');

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [showTrajectory, setShowTrajectory] = useState(false);
  const [clip, setClip] = useState<ReviewClip | null>(null);
  const [clipSrc, setClipSrc] = useState('');
  const [audio, setAudio] = useState<ClipAudio | null>(null);
  const [phase, setPhase] = useState<'review' | 'reveal'>('review');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const playRef = useRef<() => void>(() => {});
  const stepRef = useRef<(dir: number) => void>(() => {});

  const label = reviewLabel(reviewType);
  const frame = duration > 0 ? Math.floor(currentTime * 30) : 0;
  const totalFrames = duration > 0 ? Math.floor(duration * 30) : 0;

  /* Load clip from localStorage index */
  useEffect(() => {
    setClip(getClip(clipId));
    const onChange = () => setClip(getClip(clipId));
    const onDetach = () => {
      deleteClip(clipId);
      setClip(null);
    };
    window.addEventListener('turf-drs:clips-changed', onChange);
    window.addEventListener('turf-drs:clip-detached', onDetach);
    return () => {
      window.removeEventListener('turf-drs:clips-changed', onChange);
      window.removeEventListener('turf-drs:clip-detached', onDetach);
    };
  }, [clipId]);

  /* Resolve playable URL */
  useEffect(() => {
    let active = true;
    if (!clip) {
      setClipSrc('');
      return;
    }
    resolveClipUrl(clip).then((url) => {
      if (active) setClipSrc(url);
    });
    return () => {
      active = false;
    };
  }, [clip]);

  /* Sync real <video> element events */
  const onLoadedMetadata = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration);
    setCurrentTime(v.currentTime);
  }, []);

  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
  }, []);

  const onEnded = useCallback(() => {
    setPlaying(false);
  }, []);

  /* Playback rate */
  useEffect(() => {
    const v = videoRef.current;
    if (v) v.playbackRate = speed;
  }, [speed, clipSrc]);

  /* Decode audio from the real clip */
  useEffect(() => {
    let active = true;
    if (!clipSrc) {
      setAudio(null);
      return;
    }
    analyzeClipAudio(clipSrc).then((result) => {
      if (active) setAudio(result);
    });
    return () => {
      active = false;
    };
  }, [clipSrc]);

  /* AI analysis: run when type changes or clip is first loaded. If AI is
     unavailable we show an honest "watch the clip" state — never simulated
     findings dressed up as real evidence. */
  useEffect(() => {
    let active = true;
    async function load() {
      setAiStatus('analyzing');
      try {
        if (clip?.path) {
          const result = await analyzeDelivery({
            matchId: 'standalone',
            ballId: clipId,
            type: reviewType,
            clipPath: clip.path,
          });
          if (active) {
            setAnalysis(result);
            setEvidence(result.evidence);
          }
        }
      } catch {
        /* AI unavailable — analysis stays null, UI shows the honest state */
      } finally {
        if (active) setAiStatus('done');
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [reviewType, clipId, clip?.path]);

  /* Review type change — reset decision + trajectory */
  useEffect(() => {
    setDecision(DEFAULT_DECISION[reviewType]);
    setShowTrajectory(false);
  }, [reviewType]);

  /* Transport controls */
  const play = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {
        /* autoplay blocked — rely on click */
      });
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }, []);
  playRef.current = play;

  const replay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    setCurrentTime(0);
    v.play().catch(() => {});
    setPlaying(true);
  }, []);

  const stepFrame = useCallback(
    (dir: number) => {
      const v = videoRef.current;
      if (!v) return;
      v.pause();
      setPlaying(false);
      v.currentTime = Math.max(0, Math.min(duration, v.currentTime + dir * FRAME_SEC));
    },
    [duration],
  );
  stepRef.current = stepFrame;

  const changeSpeed = useCallback((value: number) => {
    setSpeed(value);
  }, []);

  const seekFromPointer = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const progress = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
      const v = videoRef.current;
      if (!v || !duration) return;
      v.currentTime = progress * duration;
      setCurrentTime(v.currentTime);
    },
    [duration],
  );

  /* Keyboard */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (phaseRef.current === 'reveal') {
          setPhase('review');
          setSaveError(null);
        } else {
          handleExit();
        }
        return;
      }
      if (phaseRef.current === 'reveal') {
        if (event.key === '1') setDecision('OUT');
        else if (event.key === '2') setDecision('NOT OUT');
        else if (event.key === '3') setDecision('INCONCLUSIVE');
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        playRef.current();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        stepRef.current(-1);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        stepRef.current(1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Lock scroll */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleExit = () => {
    router.replace(from === 'history' ? '/reviews' : from === 'live' ? '/live' : '/review');
  };

  const handleReturn = async () => {
    if (returning) return;
    setReturning(true);
    setSaveError(null);
    try {
      const onField = onFieldFor(reviewType);
      const review: Review = {
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `rv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        matchId: 'standalone',
        matchLabel: 'Standalone review',
        ballId: clipId,
        type: reviewType,
        onField,
        decision,
        status: deriveStatus(onField, decision),
        reason: analysis?.analyzedBy === 'ai' && analysis.reason ? analysis.reason : reasonFor(reviewType, decision),
        createdAt: Date.now(),
        clipPath: clip?.path,
        clipUrl: clip?.url,
      };
      await saveReview(review);
      router.replace(from === 'history' ? '/reviews' : from === 'live' ? '/live' : '/review');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Save failed — please try again.');
      setReturning(false);
    }
  };

  const playheadPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const contactMs =
    analysis?.analyzedBy === 'ai' && evidence?.contactFrame != null
      ? evidence.contactFrame * 33.33
      : audio?.peakAtMs ?? null;

  const verdictNote =
    decision === 'INCONCLUSIVE'
      ? 'Insufficient evidence'
      : decision === 'OUT'
        ? 'Decision: OUT'
        : 'Decision: NOT OUT';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-[80] flex select-none flex-col overflow-hidden bg-[#04060b] text-foreground"
    >
      {/* Broadcast vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 8%, rgba(251,191,36,0.05), transparent 45%), radial-gradient(90% 70% at 50% 100%, rgba(34,211,238,0.04), transparent 50%), radial-gradient(90% 90% at 70% 20%, rgba(251,191,36,0.05), transparent 55%)',
        }}
      />

      {/* Top bar */}
      <header className="relative z-20 flex h-12 shrink-0 items-center justify-between border-b border-white/10 bg-[#0a0e16] px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-400/15 ring-1 ring-amber-400/30">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-300" />
          </span>
          <p className="truncate font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-300 sm:text-xs">
            Third Umpire Review
            <span className="mx-2 text-white/25">•</span>
            <span className="text-white/80">{label}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden font-mono text-[10px] font-medium uppercase tracking-widest text-white/40 md:block">
            {clip?.name ?? clipId}
          </span>
          <button
            type="button"
            onClick={handleExit}
            aria-label="Exit review workstation"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/50 transition-colors hover:border-amber-400/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Decision reveal overlay */}
      {phase === 'reveal' ? (
        <div className="relative flex flex-1 flex-col items-center justify-center bg-[#03050a]/95 px-4">
          {/* Broadcast scan sweep */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
            <motion.div
              initial={{ y: '-10%' }}
              animate={{ y: '110%' }}
              transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.6 }}
              className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent blur-md"
            />
          </div>

          <div className="relative z-30 flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-8 text-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={`reveal-${decision}`}
                initial={reduceMotion ? false : { opacity: 0, scale: 0.72 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="relative flex w-full flex-1 flex-col items-center justify-center text-center"
              >
                <motion.span
                  initial={reduceMotion ? false : { letterSpacing: '0.6em', opacity: 0 }}
                  animate={{ letterSpacing: '0.26em', opacity: 1 }}
                  transition={{ duration: 0.55 }}
                  className="font-mono text-xs font-bold uppercase text-white/70 sm:text-base"
                >
                  {label}
                </motion.span>

                <motion.div
                  key={decision}
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.4, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  transition={{ delay: 0.25, type: 'spring', stiffness: 190, damping: 15 }}
                  className="relative mt-5 sm:mt-7"
                  style={{
                    textShadow: decision === 'OUT'
                      ? '0 0 42px #fb718577, 0 0 96px #fb718544'
                      : decision === 'NOT OUT'
                        ? '0 0 42px #34d39977, 0 0 96px #34d39944'
                        : '0 0 42px #fbbf2477, 0 0 96px #fbbf2444',
                  }}
                >
                  <motion.div
                    animate={{ opacity: [0.25, 0.7, 0.25] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-6 rounded-full"
                    style={{
                      background: `radial-gradient(circle, ${decision === 'OUT' ? '#fb718526' : decision === 'NOT OUT' ? '#34d39926' : '#fbbf2426'} 0%, transparent 70%)`,
                      filter: 'blur(10px)',
                    }}
                  />
                  <span
                    className="relative inline-block rounded-2xl border px-7 py-3 font-mono text-5xl font-black uppercase tracking-[0.12em] sm:px-10 sm:py-4 sm:text-7xl"
                    style={{
                      borderColor: decision === 'OUT' ? '#fb718566' : decision === 'NOT OUT' ? '#34d39966' : '#fbbf2466',
                      background: `linear-gradient(180deg, ${decision === 'OUT' ? '#fb71851a' : decision === 'NOT OUT' ? '#34d3991a' : '#fbbf241a'}, ${decision === 'OUT' ? '#fb718505' : decision === 'NOT OUT' ? '#34d39905' : '#fbbf2405'})`,
                      color: decision === 'OUT' ? '#fb7185' : decision === 'NOT OUT' ? '#34d399' : '#fbbf24',
                      boxShadow: `0 0 60px ${decision === 'OUT' ? '#fb718533' : decision === 'NOT OUT' ? '#34d39933' : '#fbbf2433'}`,
                    }}
                    aria-live="polite"
                  >
                    {decision}
                  </span>
                  <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
                    {analysis?.analyzedBy === 'ai' && analysis.reason ? analysis.reason : reasonFor(reviewType, decision)}
                  </p>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Reveal controls */}
            <motion.div
              initial={reduceMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              className="relative mt-8 w-full"
            >
              <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
                <button
                  type="button"
                  onClick={() => { setPhase('review'); setSaveError(null); }}
                  disabled={returning}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 text-sm font-semibold text-white/80 transition-all hover:border-amber-400/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60"
                >
                  <RotateCcw className="h-4 w-4" />
                  Back to Review
                </button>
                <button
                  type="button"
                  onClick={handleReturn}
                  disabled={returning}
                  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60"
                >
                  {returning ? (
                    <RotateCcw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowRight className="h-4 w-4" />
                  )}
                  {returning ? 'Saving…' : 'Save Decision & Exit'}
                </button>
              </div>
              {saveError && (
                <p className="mt-3 text-center text-xs text-rose-300">{saveError}</p>
              )}
              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] text-white/35">
                <ShieldAlert className="h-3 w-3" />
                Decision logged to your review history.
              </p>
            </motion.div>
          </div>
        </div>
      ) : (
        /* ── Review mode: real video + evidence sidebar ── */
        <div className="relative min-h-0 flex-1 lg:grid lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* HUD corner brackets */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-4 z-10 hidden sm:block">
            <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-amber-400/30" />
            <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-amber-400/30" />
            <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-amber-400/30" />
            <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-amber-400/30" />
          </div>

          {/* Video area */}
          <div className="relative min-h-0 overflow-hidden">
            {/* Real video */}
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: '49.5% 41.5%',
                transition: reduceMotion ? 'none' : 'transform 0.5s ease-out',
              }}
            >
              {clipSrc ? (
                <video
                  ref={videoRef}
                  src={clipSrc}
                  onLoadedMetadata={onLoadedMetadata}
                  onTimeUpdate={onTimeUpdate}
                  onEnded={onEnded}
                  playsInline
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-[#07120d]">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                    Loading clip…
                  </span>
                </div>
              )}
            </div>

            {/* AI trajectory overlay — drawn on top of the real video. Only ever
              rendered from AI-measured trajectory data; never canned. */}
            {analysis?.analyzedBy === 'ai' && showTrajectory && evidence?.trajectory && evidence.trajectory.length >= 2 && (
              <svg
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 z-20 h-full w-full"
                aria-hidden="true"
              >
                <polyline
                  points={evidence.trajectory.map((p) => `${p.x / 400},${p.y / 300}`).join(' ')}
                  fill="none"
                  stroke="rgba(251,191,36,0.8)"
                  strokeWidth="0.004"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {evidence.impact && (
                  <circle
                    cx={evidence.impact.x / 400}
                    cy={evidence.impact.y / 300}
                    r="0.012"
                    fill="rgba(251,191,36,0.9)"
                  />
                )}
                {/* Projected path to stumps (dashed continuation) */}
                {evidence.hitStumps && evidence.impact && (
                  <line
                    x1={evidence.impact.x / 400}
                    y1={evidence.impact.y / 300}
                    x2={evidence.impact.x / 400 - 0.04}
                    y2={0.82}
                    stroke="rgba(251,191,36,0.5)"
                    strokeWidth="0.003"
                    strokeDasharray="0.006 0.004"
                  />
                )}
              </svg>
            )}

            {/* Contact frame marker badge */}
            {evidence?.contactFrame != null && currentTime > 0 && (
              <div className="pointer-events-none absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-full border border-emerald-400/30 bg-black/70 px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300 backdrop-blur-sm">
                {reviewType === 'caught'
                  ? `CONTACT · FRAME ${evidence.contactFrame}`
                  : `IMPACT · FRAME ${evidence.contactFrame}`}
              </div>
            )}

            {/* Zoom controls */}
            <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1 rounded-full border border-white/10 bg-black/70 p-1 backdrop-blur-sm">
              <button
                type="button"
                onClick={() => setZoom((v) => Math.max(1, v - 0.25))}
                aria-label="Zoom out"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="w-10 text-center font-mono text-[10px] font-semibold text-amber-300">
                {zoom.toFixed(1)}x
              </span>
              <button
                type="button"
                onClick={() => setZoom((v) => Math.min(3, v + 0.25))}
                aria-label="Zoom in"
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Footage badge */}
            <div className="pointer-events-none absolute right-3 top-3 z-20 flex items-center gap-2 rounded-lg bg-black/70 px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-white/60 backdrop-blur-sm">
              <Video className="h-3.5 w-3.5" />
              {clip?.name ?? 'Clip'}
            </div>
          </div>

          {/* Evidence sidebar — desktop */}
          <aside aria-label="Review evidence" className="hidden shrink-0 flex-col border-l border-white/10 bg-[#0a0e16]/80 lg:flex">
            <div className="space-y-4 overflow-y-auto p-5">
              {/* Header + AI badge */}
              <div>
                <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  <Scale className="h-3 w-3" />
                  Frame Analysis
                </p>
                <h3 className="mt-1.5 text-base font-semibold tracking-tight text-foreground">{label}</h3>
                {aiStatus === 'analyzing' && (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-amber-300 ring-1 ring-amber-400/25">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analyzing clip…
                  </span>
                )}
                {aiStatus === 'done' && analysis?.analyzedBy === 'ai' && (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-emerald-300 ring-1 ring-emerald-400/25">
                    <Sparkles className="h-3 w-3" />
                    AI · {(analysis.model ?? 'gemini').replace(/^gemini-/, '').split('-').join(' ')}
                  </span>
                )}
                {aiStatus === 'done' && analysis?.analyzedBy !== 'ai' && (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-widest text-white/50 ring-1 ring-white/15">
                    <AlertTriangle className="h-3 w-3" />
                    AI unavailable
                  </span>
                )}
              </div>

              {/* Review type chips */}
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  Review type
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(['lbw', 'caught', 'runout', 'stumping', 'boundary'] as ReviewTypeId[]).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setReviewType(t)}
                      aria-pressed={reviewType === t}
                      className={cn(
                        'rounded-full border px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors',
                        reviewType === t
                          ? 'border-amber-400/40 bg-amber-400/15 text-amber-300'
                          : 'border-white/10 text-white/50 hover:text-white',
                      )}
                    >
                      {t === 'runout' ? 'Run Out' : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Findings — only when AI analyzed; otherwise honest "watch the video" */}
              <div className="space-y-2">
                {aiStatus === 'analyzing' && (
                  <div className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/[0.05] px-3 py-2.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-amber-200/80">
                      AI analyzing clip…
                    </span>
                  </div>
                )}
                {aiStatus === 'done' && analysis?.analyzedBy === 'ai' && (evidence?.findings ?? []).map((finding) => {
                  const tone =
                    finding.tone === 'good'
                      ? 'text-emerald-300'
                      : finding.tone === 'warn'
                        ? 'text-amber-300'
                        : finding.tone === 'bad'
                          ? 'text-rose-300'
                          : 'text-white/50';
                  const dot =
                    finding.tone === 'good'
                      ? 'bg-emerald-400'
                      : finding.tone === 'warn'
                        ? 'bg-amber-400'
                        : finding.tone === 'bad'
                          ? 'bg-rose-400'
                          : 'bg-white/30';
                  return (
                    <motion.div
                      key={finding.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35 }}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                    >
                      <span className="flex items-center gap-2 text-xs text-white/65">
                        <span className={cn('h-1.5 w-1.5 rounded-full', dot)} />
                        {finding.label}
                      </span>
                      <span className={cn('font-mono text-xs font-semibold', tone)}>
                        {finding.value}
                      </span>
                    </motion.div>
                  );
                })}
                {aiStatus === 'done' && analysis?.analyzedBy !== 'ai' && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4 text-center">
                    <AlertTriangle className="mx-auto h-5 w-5 text-white/40" />
                    <p className="mt-2 text-xs text-white/55">
                      AI could not read this clip — watch the video frame-by-frame and decide.
                    </p>
                  </div>
                )}
              </div>

              {/* Audio strip — real decoded audio from the clip */}
              <SnickMeter audio={audio} markerAtMs={contactMs} label="ULTRAEDGE" />

              {/* Ball tracking inset — 3D scene rendered small. AI data only. */}
              {analysis?.analyzedBy === 'ai' && evidence?.trajectory && evidence.trajectory.length >= 2 && (
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                      Ball Tracking
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowTrajectory((v) => !v)}
                      aria-pressed={showTrajectory}
                      className={cn(
                        'rounded-full px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest transition-colors',
                        showTrajectory
                          ? 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25'
                          : 'text-white/40 hover:text-white',
                      )}
                    >
                      {showTrajectory ? 'Overlay ON' : 'Overlay'}
                    </button>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-white/10">
                    <DrsScene
                      type={reviewType}
                      progress={evidence.impact ? 0.8 : 0.5}
                      view="top"
                      overlays={true}
                      zoom={1}
                    />
                  </div>
                </div>
              )}

              {/* Reason */}
              {(analysis?.analyzedBy === 'ai' || evidence) && (
                <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-3">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                    Analysis
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-white/55">
                    {analysis?.analyzedBy === 'ai' && analysis.reason
                      ? analysis.reason
                      : 'No AI analysis for this clip — review the video frame-by-frame.'}
                  </p>
                </div>
              )}
            </div>

            {/* Decision bar at the bottom of the sidebar */}
            <div className="border-t border-white/10 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  On-field call
                </span>
                <span
                  className={cn(
                    'rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest',
                    onFieldFor(reviewType) === 'OUT'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
                  )}
                >
                  {onFieldFor(reviewType)}
                </span>
              </div>
              <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                Third umpire decision
              </p>
              <div className="flex gap-1.5">
                {(['OUT', 'NOT OUT', 'INCONCLUSIVE'] as Decision[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => { setDecision(d); setPhase('reveal'); }}
                    className={cn(
                      'flex-1 rounded-xl px-2 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                      d === 'OUT'
                        ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/30 hover:bg-rose-500/25'
                        : d === 'NOT OUT'
                          ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-300 ring-1 ring-amber-500/30 hover:bg-amber-500/25',
                    )}
                  >
                    {d === 'NOT OUT' ? 'NOT OUT' : d}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Bottom timeline — always visible in review mode */}
      {phase === 'review' && (
        <section className="relative z-20 shrink-0 border-t border-white/10 bg-[#0a0e16] px-4 py-3 sm:px-6">
          <div
            className="group cursor-pointer touch-none"
            onClick={seekFromPointer}
            onPointerDown={seekFromPointer}
          >
            {/* Waveform bars behind the playhead */}
            {audio?.peaks && audio.peaks.length > 0 ? (
              <div className="relative mb-1 flex h-6 items-end gap-px" aria-hidden="true">
                {audio.peaks.map((level, index) => {
                  const t = index / Math.max(1, audio.peaks.length - 1);
                  const isPast = t * duration <= currentTime;
                  return (
                    <span
                      key={index}
                      className={cn(
                        'w-full origin-center rounded-[1px]',
                        isPast ? 'bg-amber-400/60' : 'bg-teal-400/30',
                      )}
                      style={{ height: `${Math.max(8, level * 100)}%` }}
                    />
                  );
                })}
                {contactMs != null && (
                  <span
                    className="pointer-events-none absolute top-0 h-full w-px bg-rose-400/80"
                    style={{ left: `${(contactMs / 1000 / Math.max(1, duration)) * 100}%` }}
                  />
                )}
              </div>
            ) : (
              <div className="relative h-2.5 rounded-full bg-white/10">
                <div
                  aria-hidden="true"
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500/70 to-amber-400/70 transition-[width] duration-100"
                  style={{ width: `${playheadPercent}%` }}
                />
              </div>
            )}
            {/* Playhead */}
            <div
              className="relative h-2.5"
            >
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/10" />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500/70 to-amber-400/70 transition-[width] duration-100"
                style={{ width: `${playheadPercent}%` }}
              />
              <div
                className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300 bg-[#0a0e16] shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                style={{ left: `${playheadPercent}%` }}
              >
                <span className="absolute -top-3 left-1/2 h-2 w-0.5 -translate-x-1/2 bg-amber-300" />
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] font-medium uppercase tracking-widest text-white/40">
            <span>
              Frame <span className="text-amber-300">{String(frame).padStart(3, '0')}</span> / {totalFrames}
            </span>
            <span className="hidden sm:inline">{label}</span>
            <span>
              <span className="text-amber-300">{formatTime(currentTime)}</span> / {formatTime(duration)}
            </span>
          </div>
        </section>
      )}

      {/* Controls — review mode only */}
      {phase === 'review' && (
        <section className="relative z-20 flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-[#0a0e16] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={replay}
              aria-label="Replay from start"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 transition-colors hover:border-amber-400/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={play}
              aria-label={playing ? 'Pause' : 'Play'}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-[#0a0e16] shadow-lg shadow-amber-400/25 transition-all hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          </div>

          {/* Slow motion */}
          <div className="mx-1 hidden h-10 items-center rounded-xl border border-white/10 p-1 sm:flex">
            {SPEEDS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => changeSpeed(value)}
                aria-pressed={speed === value}
                className={cn(
                  'rounded-lg px-2.5 py-1.5 font-mono text-[11px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                  speed === value ? 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30' : 'text-white/45 hover:text-white',
                )}
              >
                {value}x
              </button>
            ))}
          </div>

          {/* Frame stepping */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => stepFrame(-1)}
              aria-label="Previous frame"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 transition-colors hover:border-amber-400/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
              {String(frame).padStart(3, '0')}
            </span>
            <button
              type="button"
              onClick={() => stepFrame(1)}
              aria-label="Next frame"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 transition-colors hover:border-amber-400/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Zoom */}
          <div className="mx-1 hidden h-10 items-center rounded-xl border border-white/10 p-1 md:flex">
            <button
              type="button"
              onClick={() => setZoom((v) => Math.max(1, v - 0.25))}
              aria-label="Zoom out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-mono text-[11px] font-semibold text-amber-300">{zoom.toFixed(2)}x</span>
            <button
              type="button"
              onClick={() => setZoom((v) => Math.min(3, v + 0.25))}
              aria-label="Zoom in"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Decision hint — mobile */}
          <div className="ml-1 flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] px-3.5 py-2">
            <span
              className={cn(
                'font-mono text-xs font-bold uppercase tracking-[0.2em]',
                decision === 'NOT OUT' ? 'text-emerald-300' : decision === 'OUT' ? 'text-rose-300' : 'text-amber-300',
              )}
            >
              {decision}
            </span>
            <span className="hidden font-mono text-[10px] uppercase tracking-widest text-white/40 sm:inline">
              {verdictNote}
            </span>
          </div>

          {/* Mobile decision trigger */}
          <button
            type="button"
            onClick={() => setPhase('reveal')}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-400/90 px-4 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0e16] transition-all hover:bg-amber-300 lg:hidden"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Review Decision
          </button>
        </section>
      )}

      {/* Bottom hint */}
      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-white/5 bg-[#06080d] px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-white/25">
        {phase === 'review' ? (
          <>
            <span><kbd className="rounded border border-white/10 px-1.5 py-0.5">Space</kbd> Play / Pause</span>
            <span>
              <kbd className="rounded border border-white/10 px-1.5 py-0.5">←</kbd>
              <kbd className="ml-0.5 rounded border border-white/10 px-1.5 py-0.5">→</kbd> Frame step
            </span>
            <span><kbd className="rounded border border-white/10 px-1.5 py-0.5">Esc</kbd> Exit</span>
          </>
        ) : (
          <>
            <span><kbd className="rounded border border-white/10 px-1.5 py-0.5">1</kbd> OUT</span>
            <span><kbd className="rounded border border-white/10 px-1.5 py-0.5">2</kbd> NOT OUT</span>
            <span><kbd className="rounded border border-white/10 px-1.5 py-0.5">3</kbd> INCONCLUSIVE</span>
            <span><kbd className="rounded border border-white/10 px-1.5 py-0.5">Esc</kbd> Exit</span>
          </>
        )}
      </footer>
    </motion.div>
  );
}