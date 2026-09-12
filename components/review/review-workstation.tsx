'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Activity,
  Camera,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  Scale,
  ScanLine,
  ShieldAlert,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { SnickAudio } from '@/components/review/snick-audio';
import { DecisionReveal } from '@/components/review/decision-reveal';
import {
  BOUNCE_T as BALL_BOUNCE_T,
  IMPACT_T as BALL_IMPACT_T,
} from '@/lib/drs/trajectory';
import { demoService, onFieldFor, reasonFor } from '@/lib/drs/demo-service';
import { saveReview } from '@/lib/drs/store';
import type { Decision, Review, ReviewEvidence, ReviewTypeId } from '@/lib/drs/types';
import { cn } from '@/lib/utils';

const ThreeDrsScene = dynamic(
  () => import('@/components/review/three-drs').then((module) => module.ThreeDrsScene),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-[16/10] w-full items-center justify-center rounded-lg border border-white/10 bg-[#07120d]">
        <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
          Loading 3D replay…
        </span>
      </div>
    ),
  },
);

const TOTAL_FRAMES = 300;
const TOTAL_SECONDS = 6;
const BASE_RATE = 1 / TOTAL_SECONDS;
const CLAMP = (p: number) => Math.min(Math.max(p, 0), 1);

/* Shared delivery timeline: release -> pitch -> impact (umpire-end view). */
const RELEASE_T = 0.26;
const BOUNCE_T = BALL_BOUNCE_T;
const IMPACT_T = BALL_IMPACT_T;

const SEGMENTS = [
  { id: 'runup', label: 'Run-Up', from: 0, to: RELEASE_T },
  { id: 'release', label: 'Release', from: RELEASE_T, to: BOUNCE_T },
  { id: 'bounce', label: 'Bounce', from: BOUNCE_T, to: IMPACT_T },
  { id: 'impact', label: 'Impact', from: IMPACT_T, to: 0.86 },
  { id: 'post', label: 'Post Impact', from: 0.86, to: 1 },
];

const SPEEDS = [0.25, 0.5, 1, 2] as const;

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

export function ReviewWorkstation({
  type,
  ball = '16.4',
  from = 'live',
  matchId = 'demo-live',
  matchLabel = 'Falcons vs Strikers · Hyderabad Turf League',
}: {
  type: string;
  ball?: string;
  from?: 'live' | 'history' | 'demo';
  matchId?: string;
  matchLabel?: string;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  const reviewType = useMemo(() => normalizeType(type), [type]);
  const [phase, setPhase] = useState<'capture' | 'analysis' | 'reveal'>('capture');
  const [view, setView] = useState<'umpire' | 'top'>('umpire');
  const [evidence, setEvidence] = useState<ReviewEvidence | null>(null);
  const [decision, setDecision] = useState<Decision>(DEFAULT_DECISION[reviewType]);
  const [returning, setReturning] = useState(false);

  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const [zoom, setZoom] = useState(1);
  const [overlays, setOverlays] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const progressRef = useRef(0);
  const autoRef = useRef(true);
  const slowTriggeredRef = useRef(false);
  const analysisPendingRef = useRef(false);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const label = reviewLabel(reviewType);
  const frame = Math.round(progress * (TOTAL_FRAMES - 1));
  const timestamp = formatTime(progress * TOTAL_SECONDS);
  const isLbw = reviewType === 'lbw';
  const isCaught = reviewType === 'caught';

  /* Load evidence through the service (real CV plugs in here later). */
  useEffect(() => {
    let active = true;
    demoService
      .requestEvidence({ matchId, ballId: ball, type: reviewType })
      .then((result) => {
        if (active) setEvidence(result);
      });
    return () => {
      active = false;
    };
  }, [reviewType, ball]);

  const flashFor = useCallback((text: string, ms = 1100) => {
    setFlash(text);
    window.setTimeout(() => setFlash(null), ms);
  }, []);

  const enterAnalysis = useCallback(
    (t: ReviewTypeId) => {
      if (phaseRef.current !== 'capture') return;
      analysisPendingRef.current = false;
      setPhase('analysis');
      if (t === 'caught') flashFor('CONTACT DETECTED', 1500);
      else if (t === 'boundary') flashFor('BOUNDARY CHECK', 1500);
      else flashFor('IMPACT · 0.73s', 1500);
    },
    [flashFor],
  );

  /* Ball auto-capture loop — plays the delivery, freezes on impact, moves to analysis */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.06);
      last = now;
      const next = Math.min(progressRef.current + dt * BASE_RATE * speed, 1);

      if (autoRef.current && !slowTriggeredRef.current && next >= 0.5) {
        slowTriggeredRef.current = true;
        setSpeed(0.25);
        flashFor('SLOW MOTION');
      }

      if (autoRef.current && next >= IMPACT_T) {
        progressRef.current = IMPACT_T;
        setProgress(IMPACT_T);
        setPlaying(false);
        setOverlays(true);
        setZoom(isCaught ? 2.3 : 2);
        enterAnalysis(reviewType);
        return;
      }

      if (next >= 1) {
        progressRef.current = 1;
        setProgress(1);
        setPlaying(false);
        return;
      }

      progressRef.current = next;
      setProgress(next);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, flashFor, isCaught, enterAnalysis, reviewType]);

  /* Phase scheduling: LBW crossfades camera -> top-down pitch, then all go to reveal */
  useEffect(() => {
    if (phase !== 'analysis') return;
    const timers: number[] = [];

    if (isLbw) {
      timers.push(
        window.setTimeout(() => {
          setView('top');
          setZoom(1);
          flashFor('TOP VIEW · IN LINE CHECK', 1400);
        }, 1300),
        window.setTimeout(() => setPhase('reveal'), 9200),
      );
    } else {
      timers.push(window.setTimeout(() => setPhase('reveal'), 6500));
    }

    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [phase, isLbw, flashFor]);

  const scheduleAnalysis = useCallback(
    (t: ReviewTypeId) => {
      if (analysisPendingRef.current) return;
      analysisPendingRef.current = true;
      window.setTimeout(() => enterAnalysis(t), 700);
    },
    [enterAnalysis],
  );

  const play = () => {
    if (phaseRef.current !== 'capture') {
      setPlaying(false);
      return;
    }
    if (playing) {
      setPlaying(false);
      return;
    }
    if (autoRef.current && progressRef.current < IMPACT_T) {
      setPlaying(true);
      return;
    }
    /* Manual replay of the full sequence */
    autoRef.current = false;
    setOverlays(false);
    setPlaying(true);
  };

  const replay = () => {
    autoRef.current = true;
    slowTriggeredRef.current = false;
    analysisPendingRef.current = false;
    setPhase('capture');
    setView('umpire');
    setOverlays(false);
    setZoom(1);
    setSpeed(1);
    progressRef.current = 0;
    setProgress(0);
    setPlaying(true);
  };

  const stepFrame = (dir: number) => {
    autoRef.current = false;
    setPlaying(false);
    const next = CLAMP(progressRef.current + dir / (TOTAL_FRAMES - 1));
    if (next >= IMPACT_T) {
      setOverlays(true);
      if (phaseRef.current === 'capture') scheduleAnalysis(reviewType);
    }
    progressRef.current = next;
    setProgress(next);
  };

  const changeSpeed = (value: number) => {
    autoRef.current = false;
    slowTriggeredRef.current = true;
    setSpeed(value);
  };

  const seekTo = (target: number) => {
    autoRef.current = false;
    slowTriggeredRef.current = true;
    const next = CLAMP(target);
    if (next >= IMPACT_T) {
      setOverlays(true);
      if (phaseRef.current === 'capture') scheduleAnalysis(reviewType);
    }
    progressRef.current = next;
    setProgress(next);
  };

  const seekFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    seekTo(CLAMP((event.clientX - rect.left) / rect.width));
  };

  const adjustZoom = (dir: number) => setZoom((value) => Math.min(Math.max(value + dir, 1), 3));

  /* Keyboard */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === ' ') {
        event.preventDefault();
        if (phaseRef.current === 'reveal') return;
        setPlaying((value) => !value);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (phaseRef.current === 'reveal') return;
        const next = CLAMP(progressRef.current - 1 / (TOTAL_FRAMES - 1));
        progressRef.current = next;
        setProgress(next);
        setOverlays(next >= IMPACT_T);
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (phaseRef.current === 'reveal') return;
        const next = CLAMP(progressRef.current + 1 / (TOTAL_FRAMES - 1));
        progressRef.current = next;
        setProgress(next);
        setOverlays(next >= IMPACT_T);
      } else if (event.key === 'Escape') {
        handleExit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Lock scroll while open */
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const handleExit = () => {
    if (from === 'history') router.replace('/reviews');
    else router.replace('/live');
  };

  const handleReturn = async () => {
    if (returning) return;
    setReturning(true);
    let review: Review | null = null;
    try {
      review = await demoService.finalizeReview({
        matchId,
        ballId: ball,
        type: reviewType,
        decision,
        onField: onFieldFor(reviewType),
      });
      review = { ...review, matchLabel };
      await saveReview(review);
    } catch {
      /* still navigate so the user is never stranded */
    }
    if (from === 'history') router.replace('/reviews');
    else if (review) {
      router.replace(`/live?review=${decision}&status=${review.status}&ball=${ball}`);
    } else {
      router.replace('/live');
    }
  };

  const playheadStyle = { left: `${progress * 100}%` };
  const verdictNote =
    decision === 'INCONCLUSIVE'
      ? 'Insufficient evidence'
      : decision === 'OUT'
        ? 'Decision: OUT'
        : 'Decision: NOT OUT';

  const scope = phase === 'reveal' ? 'reveal' : phase === 'analysis' ? 'analysis' : 'capture';

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
            <span className="text-white/80">Falcons vs Strikers</span>
            <span className="mx-2 text-white/25">•</span>
            <span className="text-cyan-300">{ball}</span>
            <span className="mx-2 text-white/25">•</span>
            <span className="text-white/80">{label}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-rose-300 ring-1 ring-rose-500/25 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
            REC
          </span>
          <span className="hidden font-mono text-[10px] font-medium uppercase tracking-widest text-white/40 md:block">
            {view === 'top' ? 'CV · Top View' : 'Cam 01 · Umpire End'}
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

      {/* Central area */}
      <main className="relative min-h-0 flex-1">
        {/* HUD corner brackets */}
        {phase !== 'reveal' && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-4 z-10 hidden sm:block">
            <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-amber-400/30" />
            <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-amber-400/30" />
            <span className="absolute bottom-0 left-0 h-5 w-5 border-b-2 border-l-2 border-amber-400/30" />
            <span className="absolute bottom-0 right-0 h-5 w-5 border-b-2 border-r-2 border-amber-400/30" />
          </div>
        )}

        {phase === 'reveal' ? (
          <div className="absolute inset-0 flex items-center justify-center bg-[#03050a]/95 px-4">
            <div className="w-full max-w-2xl">
              <DecisionReveal
                type={reviewType}
                decision={decision}
                onDecision={setDecision}
                onReturn={handleReturn}
                onReset={replay}
                returning={returning}
              />
            </div>
          </div>
        ) : (
          <div className="relative grid h-full min-h-0 lg:grid-cols-[minmax(0,1fr)_320px]">
            {/* Video / scene */}
            <div className="relative min-h-0 overflow-hidden">
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: '49.5% 41.5%',
                  transition: reduceMotion ? 'none' : 'transform 0.5s ease-out',
                }}
              >
                <div className="w-full max-w-5xl px-4">
                  <ThreeDrsScene
                    type={reviewType}
                    progress={progress}
                    view={view}
                    overlays={overlays}
                  />
                </div>
              </div>

              {/* Caught — audio analysis overlay */}
              {isCaught && phase === 'analysis' && evidence && (
                <div className="absolute right-3 top-3 z-20 w-56 sm:w-64 lg:right-4">
                  <SnickAudio data={evidence.audio} playing={false} highlighted={evidence.contactConfirmed} />
                </div>
              )}

              {isCaught && phase === 'analysis' && (
                <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full border border-emerald-400/30 bg-black/70 px-4 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-300 backdrop-blur-sm">
                  {evidence?.contactFrame ? `CONTACT · FRAME ${evidence.contactFrame}` : 'CONTACT · FRAME 241'}
                </div>
              )}

              {/* LBW umpire↔top toggle */}
              {isLbw && phase === 'analysis' && (
                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-white/10 bg-black/70 p-1 backdrop-blur-sm">
                  {(['umpire', 'top'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        setView(v);
                        setZoom(v === 'umpire' ? 2.2 : 1);
                      }}
                      aria-pressed={view === v}
                      className={cn(
                        'rounded-full px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60',
                        view === v ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40' : 'text-white/50 hover:text-white',
                      )}
                    >
                      {v === 'umpire' ? 'Umpire Cam' : 'Top Cam'}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Evidence sidebar — desktop */}
            <aside aria-label="Review evidence" className="hidden shrink-0 flex-col border-l border-white/10 bg-[#0a0e16]/80 lg:flex">
              <div className="space-y-5 overflow-y-auto p-5">
                <div>
<p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                        <Scale className="h-3 w-3" />
                        Frame Analysis
                      </p>
                      <h3 className="mt-1.5 text-base font-semibold tracking-tight text-foreground">{label}</h3>
                      <p className="mt-1 text-xs text-white/55">
                        {reviewType === 'lbw' && 'Pitching line and wicket projection on the top-down pitch map.'}
                        {reviewType === 'caught' && 'Contact frame checked against the audio spike.'}
                        {reviewType === 'runout' && 'Crease + bails timed frame-by-frame.'}
                        {reviewType === 'stumping' && 'Keeper gather timed against bat grounding.'}
                        {reviewType === 'boundary' && 'Rope contact checked from the rope camera.'}
                      </p>
                </div>

                {/* Live capture indicator */}
                {scope === 'capture' && (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                        <Activity className="h-3 w-3 animate-pulse" />
                        Live capture
                      </span>
                      <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                        Umpire signal · Review
                      </span>
                    </div>
                    <div className="mt-3 flex h-8 items-end gap-1">
                      {Array.from({ length: 24 }, (_, i) => (
                        <motion.span
                          key={i}
                          animate={{ scaleY: [0.3, 0.9, 0.4], opacity: [0.5, 1, 0.5] }}
                          transition={{
                            duration: 0.8 + (i % 5) * 0.18,
                            repeat: Infinity,
                            repeatType: 'mirror',
                            ease: 'easeInOut',
                          }}
                          className="w-1 origin-bottom rounded-full bg-emerald-400/70"
                          style={{ height: `${28 * (0.4 + Math.abs(Math.sin(i * 1.7) * 0.6))}px` }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Findings */}
                {scope === 'analysis' && (
                  <div className="space-y-2">
                    {(evidence?.findings ?? []).map((finding) => {
                      const tone =
                        finding.tone === 'good'
                          ? 'text-emerald-300'
                          : finding.tone === 'warn'
                            ? 'text-amber-300'
                            : 'text-rose-300';
                      const dot =
                        finding.tone === 'good'
                          ? 'bg-emerald-400'
                          : finding.tone === 'warn'
                            ? 'bg-amber-400'
                            : 'bg-rose-400';
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
                    {!evidence && (
                      <div className="space-y-2">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="h-11 animate-pulse rounded-xl border border-white/10 bg-white/[0.04]" />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Cameras */}
                {(evidence?.cameras && evidence.cameras.length > 0 && scope !== 'reveal') && (
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                      Cameras
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {evidence.cameras.map((cam) => (
                        <div key={cam.id} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2">
                          <span className="flex items-center gap-2 font-mono text-[11px] font-semibold text-white/80">
                            <Camera className="h-3 w-3 text-white/40" />
                            {cam.name}
                          </span>
                          <span className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                            {cam.resolution} {cam.fps}fps
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {!evidence && scope !== 'reveal' && (
                  <div>
                    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                      Cameras
                    </p>
                    <div className="mt-2 space-y-1.5">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="h-9 animate-pulse rounded-lg border border-white/10 bg-white/[0.03]" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Analysis -> reveal */}
              {phase === 'analysis' && (
                <div className="border-t border-white/10 p-4">
                  <button
                    type="button"
                    onClick={() => setPhase('reveal')}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-semibold text-[#0a0e16] shadow-lg shadow-amber-400/20 transition-all hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    REVEAL DECISION
                  </button>
                </div>
              )}

              {/* Capture -> rewind hint */}
              {phase === 'capture' && (
                <div className="flex items-center gap-2 border-t border-white/10 p-4 text-[10px] text-white/40">
                  <ScanLine className="h-3.5 w-3.5 shrink-0 text-cyan-300" />
                  Auto-capture armed. Use the timeline to freeze the impact frame.
                </div>
              )}
            </aside>
          </div>
        )}

        {/* Center broadcast flash */}
        <AnimatePresence>
          {flash && phase !== 'reveal' && (
            <motion.div
              key={flash}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
            >
              <div className="rounded-lg border border-amber-400/40 bg-black/60 px-6 py-3 font-mono text-sm font-bold uppercase tracking-[0.3em] text-amber-300 shadow-[0_0_60px_rgba(251,191,36,0.25)] backdrop-blur-sm">
                {flash}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom timeline */}
      {phase !== 'reveal' && (
        <section className="relative z-20 shrink-0 border-t border-white/10 bg-[#0a0e16] px-4 py-3 sm:px-6">
          <div className="group cursor-pointer touch-none" onClick={seekFromPointer} onPointerDown={seekFromPointer}>
            <div className="flex items-center justify-between">
              {SEGMENTS.map((segment) => (
                <span
                  key={segment.id}
                  className={cn(
                    'pb-1 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] sm:text-[10px]',
                    progress >= segment.from ? 'text-amber-300' : 'text-white/30',
                  )}
                >
                  {segment.label}
                </span>
              ))}
            </div>
            <div className="relative h-2.5 rounded-full bg-white/10">
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-amber-500/70 to-amber-400/70 transition-[width] duration-100"
                style={{ width: `${progress * 100}%` }}
              />
              {SEGMENTS.map((segment) => (
                <span key={segment.id} className="absolute top-0 h-full w-px bg-white/15" style={{ left: `${segment.to * 100}%` }} />
              ))}
              <div
                className="absolute top-1/2 z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-300 bg-[#0a0e16] shadow-[0_0_12px_rgba(251,191,36,0.6)]"
                style={playheadStyle}
              >
                <span className="absolute -top-3 left-1/2 h-2 w-0.5 -translate-x-1/2 bg-amber-300" />
              </div>
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-between font-mono text-[10px] font-medium uppercase tracking-widest text-white/40">
            <span>
              Frame <span className="text-amber-300">{String(frame).padStart(3, '0')}</span> / {TOTAL_FRAMES - 1}
            </span>
            <span className="hidden sm:inline">
              {label} · {ball} · <span className="text-cyan-300">240 fps</span>
            </span>
            <span>
              <span className="text-amber-300">{timestamp}</span> / {formatTime(TOTAL_SECONDS)}
            </span>
          </div>
        </section>
      )}

      {/* Controls */}
      {phase !== 'reveal' && (
        <section className="relative z-20 flex shrink-0 flex-wrap items-center justify-center gap-2 border-t border-white/10 bg-[#0a0e16] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={play}
              aria-label={playing ? 'Pause' : 'Play'}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-[#0a0e16] shadow-lg shadow-amber-400/25 transition-all hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={replay}
              aria-label="Replay sequence"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 transition-colors hover:border-amber-400/30 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          {/* Slow motion — 0.25x / 0.5x / 1x / 2x */}
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
              onClick={() => adjustZoom(-0.25)}
              aria-label="Zoom out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-10 text-center font-mono text-[11px] font-semibold text-amber-300">{zoom.toFixed(2)}x</span>
            <button
              type="button"
              onClick={() => adjustZoom(0.25)}
              aria-label="Zoom in"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          {/* Manual frame scrub (mobile/tablet) */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => stepFrame(-10)}
              aria-label="Back 10 frames"
              className="flex h-8 items-center rounded-lg border border-white/10 px-2.5 font-mono text-[10px] text-white/60 transition-colors hover:border-amber-400/30 hover:text-white"
            >
              -10f
            </button>
            <button
              type="button"
              onClick={() => stepFrame(10)}
              aria-label="Forward 10 frames"
              className="flex h-8 items-center rounded-lg border border-white/10 px-2.5 font-mono text-[10px] text-white/60 transition-colors hover:border-amber-400/30 hover:text-white"
            >
              +10f
            </button>
          </div>

          {/* Reveal trigger (mobile/tablet) */}
          {phase === 'analysis' && (
            <button
              type="button"
              onClick={() => setPhase('reveal')}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-amber-400/90 px-4 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0e16] transition-all hover:bg-amber-300 lg:hidden"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              Reveal Decision
            </button>
          )}

          {/* Decision note */}
          {phase === 'capture' && decision && (
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
          )}
        </section>
      )}

      {/* Bottom hint */}
      <footer className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-white/5 bg-[#06080d] px-4 py-2 font-mono text-[9px] uppercase tracking-widest text-white/25">
        {phase !== 'reveal' ? (
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

      {/* Reason strip */}
      {phase === 'reveal' && evidence && (
        <div className="relative z-20 shrink-0 border-t border-white/10 bg-[#0a0e16] px-4 py-3 text-center">
          <span className="font-mono text-[10px] font-medium uppercase tracking-widest text-white/50 sm:text-[11px]">
            {reasonFor(reviewType, decision)}
          </span>
        </div>
      )}
    </motion.div>
  );
}