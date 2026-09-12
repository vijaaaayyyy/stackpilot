'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
  Footprints,
  Gauge,
  Loader2,
  Pause,
  Play,
  RotateCcw,
  ScanLine,
  Send,
  ShieldAlert,
  ShieldCheck,
  Upload,
  Video,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { StatusPill } from '@/components/cameras/status-pill';
import type { Decision, Review } from '@/lib/drs/types';
import {
  BOUNCE,
  BOUNCE_T,
  IMPACT_T,
  PAD,
  SEG2_END,
  STUMP_HIT,
  ballRadiusAt,
  ballShadow,
  bezier,
  deliveryPosition,
  flightPath,
  type Outcome,
  type Point,
} from '@/lib/drs/trajectory';
import { cn } from '@/lib/utils';
import { ClipRecorder, uploadClip } from '@/lib/drs/clips';
import { saveDraftReview } from '@/lib/drs/store';

type Delivery = {
  over: string;
  result: string;
  outcome: Outcome;
  description: string;
};

const DELIVERIES: Delivery[] = [
  {
    over: '16.1',
    result: 'DOT',
    outcome: 'beat',
    description: 'Good length, beat the outside edge.',
  },
  {
    over: '16.2',
    result: '1 RUN',
    outcome: 'run',
    description: 'Driven through the off side, one taken.',
  },
  {
    over: '16.3',
    result: '2 RUNS',
    outcome: 'run',
    description: 'Flicked wide of mid-wicket, quick two.',
  },
  {
    over: '16.4',
    result: 'REVIEW',
    outcome: 'lbw',
    description: 'Struck on the pad — LBW appeal signalled.',
  },
];

const DURATION = 3.4;
const NORMAL_RATE = 1 / DURATION;
const SLOW_RATE = 1 / (DURATION * 4.5);

const RESULT_TONE: Record<Outcome, string> = {
  beat: 'border-foreground/10 bg-foreground/[0.03] text-muted-foreground',
  run: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
  lbw: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
};

const REVIEW_TYPES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'lbw', label: 'LBW', icon: ScanLine },
  { id: 'caught', label: 'Caught Behind', icon: Video },
  { id: 'runout', label: 'Run Out', icon: Footprints },
  { id: 'stumping', label: 'Stumping', icon: Gauge },
  { id: 'boundary', label: 'Boundary', icon: ShieldCheck },
];

const PROCESS_STEPS = [
  'Retrieving delivery…',
  'Video retrieved',
  'Delivery identified',
  'Analysing frames…',
  'Ball tracking…',
];

function ReviewFlowOverlay({
  open,
  over,
  onClose,
  onDecision,
  auto = false,
}: {
  open: boolean;
  over: string;
  onClose: () => void;
  onDecision: (type: string) => void;
  auto?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState<'intro' | 'type' | 'process' | 'ready'>('intro');
  const [selected, setSelected] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStage('intro');
    setSelected(null);
    setStep(0);
    const timer = setTimeout(() => setStage('type'), 2100);
    return () => clearTimeout(timer);
  }, [open]);

  /* Demo autopilot — drives the whole request flow without input. */
  useEffect(() => {
    if (!open || !auto) return;
    if (stage === 'type' && !selected) {
      const timer = setTimeout(() => {
        setSelected('lbw');
        setStep(0);
        setStage('process');
      }, 700);
      return () => clearTimeout(timer);
    }
    if (stage === 'ready') {
      const timer = setTimeout(() => onDecision('lbw'), 500);
      return () => clearTimeout(timer);
    }
  }, [open, auto, stage, selected, onDecision]);

  useEffect(() => {
    if (stage !== 'process') return;
    if (step >= PROCESS_STEPS.length) {
      const timer = setTimeout(() => setStage('ready'), 380);
      return () => clearTimeout(timer);
    }
    const timer = setTimeout(() => setStep((value) => value + 1), 300);
    return () => clearTimeout(timer);
  }, [stage, step]);

  useEffect(() => {
    if (!open || stage === 'process') return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, stage, onClose]);

  const sendForReview = () => {
    if (!selected) return;
    setStep(0);
    setStage('process');
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 px-4 backdrop-blur-[3px]"
          onClick={() => {
            if (stage !== 'process') onClose();
          }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Third umpire review"
            initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className="glass relative w-full max-w-md overflow-hidden rounded-3xl bg-[#0b0b14]/95 p-6 shadow-2xl shadow-black/60 sm:p-8"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-56 w-96 -translate-x-1/2 rounded-full blur-[90px]"
              style={{
                background:
                  'radial-gradient(circle, rgba(45, 212, 191, 0.16), transparent 70%)',
              }}
            />
            <span
              aria-hidden="true"
              className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent"
            />

            <div className="relative flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Turf DRS Console
              </span>
              <button
                type="button"
                onClick={onClose}
                disabled={stage === 'process'}
                aria-label="Close review"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/10 text-muted-foreground transition-colors hover:border-teal-500/30 hover:text-foreground disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-6 min-h-[300px]">
              <AnimatePresence mode="wait">
                {stage === 'intro' && (
                  <motion.div
                    key="intro"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-5 py-10 text-center"
                  >
                    <motion.div
                      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.45, ease: 'easeOut' }}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/25"
                    >
                      <ShieldAlert className="h-6 w-6 text-teal-300" />
                    </motion.div>
                    <div>
                      <motion.p
                        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                        className="text-sm font-semibold uppercase tracking-[0.3em] text-foreground"
                      >
                        Third Umpire Review
                      </motion.p>
                      <motion.p
                        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.55 }}
                        className="mt-2 text-xs font-medium uppercase tracking-[0.25em] text-muted-foreground"
                      >
                        Delivery {over}
                      </motion.p>
                      <motion.p
                        initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: 0.95 }}
                        className="mt-2 text-2xl font-semibold tracking-tight text-teal-300"
                      >
                        REVIEW REQUESTED
                      </motion.p>
                    </div>
                  </motion.div>
                )}

                {stage === 'type' && (
                  <motion.div
                    key="type"
                    initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -12 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
                      Select review type
                    </p>
                    <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
                      What are we checking?
                    </h3>

                    <div className="mt-5 space-y-2">
                      {REVIEW_TYPES.map((type) => {
                        const Icon = type.icon;
                        const isSelected = selected === type.id;
                        return (
                          <button
                            key={type.id}
                            type="button"
                            onClick={() => setSelected(type.id)}
                            aria-pressed={isSelected}
                            className={cn(
                              'flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all',
                              isSelected
                                ? 'border-teal-500/40 bg-teal-500/[0.06] ring-1 ring-teal-500/25'
                                : 'border-foreground/10 bg-foreground/[0.02] hover:border-teal-500/25',
                            )}
                          >
                            <span
                              className={cn(
                                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                                isSelected
                                  ? 'bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/25'
                                  : 'bg-foreground/[0.04] text-muted-foreground',
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="flex-1 text-sm font-medium text-foreground">
                              {type.label}
                            </span>
                            <span
                              aria-hidden="true"
                              className={cn(
                                'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all',
                                isSelected
                                  ? 'border-teal-400 bg-teal-500'
                                  : 'border-foreground/20 bg-transparent',
                              )}
                            >
                              {isSelected && (
                                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={sendForReview}
                      disabled={!selected}
                      className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-teal-500 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send className="h-4 w-4" />
                      SEND FOR REVIEW
                    </button>
                  </motion.div>
                )}

                {stage === 'process' && (
                  <motion.div
                    key="process"
                    initial={reduceMotion ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    className="py-2"
                  >
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground/70">
                      Third umpire processing
                    </p>
                    <div className="mt-5 space-y-3">
                      {PROCESS_STEPS.map((label, i) => {
                        const done = i < step;
                        const active = i === step;
                        return (
                          <motion.div
                            key={label}
                            initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className={cn(
                              'flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300',
                              active
                                ? 'border-teal-500/25 bg-teal-500/[0.04]'
                                : done
                                  ? 'border-emerald-500/20 bg-emerald-500/[0.03]'
                                  : 'border-foreground/10 bg-foreground/[0.02] opacity-40',
                            )}
                          >
                            {done ? (
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                                <Check className="h-3 w-3 text-emerald-300" />
                              </span>
                            ) : active ? (
                              <Loader2 className="h-5 w-5 animate-spin text-teal-300" />
                            ) : (
                              <span className="h-5 w-5 shrink-0 rounded-full border border-foreground/15" />
                            )}
                            <span
                              className={cn(
                                'text-sm',
                                active
                                  ? 'font-medium text-foreground'
                                  : done
                                    ? 'text-emerald-200/80'
                                    : 'text-muted-foreground',
                              )}
                            >
                              {label}
                            </span>
                          </motion.div>
                        );
                      })}
                    </div>
                    <p className="mt-5 text-center text-[11px] text-muted-foreground/60">
                      Analysis takes under 30 seconds on-field — Turf DRS keeps the game moving.
                    </p>
                  </motion.div>
                )}

                {stage === 'ready' && (
                  <motion.div
                    key="ready"
                    initial={reduceMotion ? false : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex flex-col items-center text-center"
                  >
                    <motion.span
                      initial={reduceMotion ? false : { scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
                      className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/25"
                    >
                      <Check className="h-7 w-7 text-emerald-300" />
                    </motion.span>
                    <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                      REVIEW READY
                    </p>
                    <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                      Delivery {over} — {(selected ?? '').toUpperCase()} evidence compiled. All frames
                      locked and synced.
                    </p>
                    <div className="mt-6 flex w-full flex-col gap-2.5 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => selected && onDecision(selected)}
                        className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Open Decision
                      </button>
                      <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-11 items-center justify-center rounded-xl border border-foreground/10 bg-transparent px-5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                      >
                        Back to Live
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function LiveMatchView({
  demo = false,
  matchId = 'demo-live',
  matchLabel = 'Falcons vs Strikers · Hyderabad Turf League',
  initialReview = null,
}: {
  demo?: boolean;
  matchId?: string;
  matchLabel?: string;
  initialReview?: Review | null;
}) {
  const router = useRouter();
  const gradientId = useId();
  const skyId = useId();
  const groundId = useId();
  const trailBlurId = useId();
  const pitchGlowId = useId();
  const wicketGlowId = useId();

  const [index, setIndex] = useState(DELIVERIES.length - 1);
  const [progress, setProgress] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [lastReview, setLastReview] = useState<Review | null>(initialReview);
  const [reviewedBall, setReviewedBall] = useState<Decision | null>(initialReview?.decision ?? null);
  const progressRef = useRef(0);
  const [seq, setSeq] = useState(0);

  /* Umpire-end phone camera — live feed + rolling capture for the last delivery. */
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [camSeconds, setCamSeconds] = useState(0);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [camSaving, setCamSaving] = useState(false);
  const [camUpload, setCamUpload] = useState<{
    status: 'done' | 'error';
    ball?: string;
    message: string;
  } | null>(null);
  const camRecorderRef = useRef<ClipRecorder | null>(null);
  const camPreviewRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (camStream && camPreviewRef.current) camPreviewRef.current.srcObject = camStream;
  }, [camStream]);

  useEffect(
    () => () => {
      camRecorderRef.current?.destroy().catch(() => undefined);
    },
    [],
  );

  const toggleCam = async () => {
    if (camRecorderRef.current?.recording) {
      await camRecorderRef.current.stop();
      setCamOn(false);
      setCamStream(null);
      setCamSeconds(0);
      return;
    }
    setCamErr(null);
    const rec = new ClipRecorder();
    rec.onTick = setCamSeconds;
    rec.onError = (message) => setCamErr(message);
    camRecorderRef.current = rec;
    await rec.start();
    setCamOn(rec.recording);
    setCamStream(rec.stream);
  };

  const delivery = DELIVERIES[index];
  const isDone = progress >= 1;

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.06);
      last = now;
      const next = Math.min(progressRef.current + dt * (slow ? SLOW_RATE : NORMAL_RATE), 1);
      progressRef.current = next;
      setProgress(next);
      if (next < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, slow]);

  const replay = useCallback(
    (to?: number) => {
      const target = to ?? index;
      setIndex(target);
      progressRef.current = 0;
      setProgress(0);
      setPlaying(true);
      setSeq((value) => value + 1);
    },
    [index],
  );

  const togglePlay = () => {
    if (playing) {
      setPlaying(false);
      return;
    }
    if (progressRef.current >= 1) {
      progressRef.current = 0;
      setProgress(0);
    }
    setPlaying(true);
  };

  const stepBall = useCallback(
    (dir: number) => {
      const next = Math.min(Math.max(index + dir, 0), DELIVERIES.length - 1);
      replay(next);
    },
    [index, replay],
  );

  const requestReview = () => {
    setReviewOpen(true);
  };

  /* Cut the last <keepSeconds> of the phone's rolling capture (the final
     delivery), upload it to drs-clips as {match}/{ball}.webm, and write the
     draft drs_reviews row. The rolling buffer keeps recording for the next
     delivery. Returns the ball id, or null on failure. */
  const captureLastDelivery = useCallback(
    async (keepSeconds = 15): Promise<string | null> => {
      const camNow = camRecorderRef.current;
      if (!camNow?.recording) {
        setCamUpload({ status: 'error', message: 'No recording in progress — press Record before the ball.' });
        return null;
      }
      setCamSaving(true);
      try {
        const blob = camNow.snapshot(keepSeconds);
        if (!blob) throw new Error('Nothing was captured — recording is less than a couple of seconds old.');
        const { clip, ok } = await uploadClip(blob, delivery.over, {
          matchId,
          durationMs: Math.round(camNow.seconds * 1000),
        });
        if (ok) {
          await saveDraftReview({
            matchId,
            matchLabel,
            ballId: delivery.over,
            clipPath: clip.path,
          });
        }
        setCamUpload({
          status: 'done',
          ball: delivery.over,
          message: ok ? 'Uploaded to the drs-clips bucket.' : 'Saved on this device — no storage bucket yet.',
        });
        return delivery.over;
      } catch (error) {
        setCamUpload({
          status: 'error',
          message: error instanceof Error ? error.message : 'Upload failed',
        });
        return null;
      } finally {
        setCamSaving(false);
      }
    },
    [delivery.over, matchId, matchLabel],
  );

  const goReview = async (type: string) => {
    /* Best-effort: cut + upload the last delivery before opening the review */
    if (camRecorderRef.current?.recording) {
      await captureLastDelivery(15);
    }
    setReviewOpen(false);
    router.push(
      `/review?type=${type}&ball=${delivery.over}&match=${matchId}&title=${encodeURIComponent(matchLabel)}${demo ? '&from=demo' : ''}`,
    );
  };

  /* Demo autopilot: play the final delivery, then auto-request the LBW review. */
  useEffect(() => {
    if (!demo) return;
    if (index !== DELIVERIES.length - 1) replay(DELIVERIES.length - 1);
    if (isDone && !reviewOpen) {
      const timer = setTimeout(() => setReviewOpen(true), 250);
      return () => clearTimeout(timer);
    }
  }, [demo, isDone, reviewOpen, index, replay]);

  const pos = isDone ? SEG2_END[delivery.outcome] : deliveryPosition(delivery.outcome, progress);
  const ballRadius = ballRadiusAt(pos.y);
  const shadow = ballShadow(pos);
  const trail = flightPath(delivery.outcome, progress);
  const justBounced = progress >= BOUNCE_T && progress < BOUNCE_T + 0.18 && progress < 1;
  const justImpacted = delivery.outcome === 'lbw' && progress >= IMPACT_T && progress < 1;
  const batSwinging = delivery.outcome === 'run' && progress > 0.5;
  const wickets = 5 + (reviewedBall === 'OUT' ? 1 : 0);
  const runs = 142;
  /* LBW after pitching: keep the umpire's call markers + projection on screen. */
  const showLbwOverlay = delivery.outcome === 'lbw' && progress >= BOUNCE_T;
  const projectionEnd = STUMP_HIT;

  /* Stands lights behind the pitch — deterministic, cheap to re-render. */
  const crowdDots = Array.from({ length: 30 }, (_, i) => ({
    x: 14 + ((i * 47) % 612),
    y: 102 + Math.floor((i * 29) % 18),
    r: 0.7 + (i % 3) * 0.35,
    o: 0.06 + (i % 4) * 0.05,
  }));

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Scene card */}
      <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-[#0b0b14]/90 shadow-xl shadow-black/30">
        <span
          aria-hidden="true"
          className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/60 to-transparent"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusPill tone="rose">Live</StatusPill>
            <span className="rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-semibold text-foreground/80">
              CAM 01
            </span>
            <span className="rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-semibold text-foreground/80">
              1080p 60 FPS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCam}
              disabled={!camOn && Boolean(camErr)}
              className={cn(
                'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors',
                camOn
                  ? 'border-rose-500/50 bg-rose-500/15 text-rose-300'
                  : camErr
                    ? 'border-white/10 text-white/40'
                    : 'border-white/15 bg-white/5 text-foreground/80 hover:border-rose-500/40 hover:text-rose-300',
              )}
              title={
                camErr
                  ? camErr
                  : 'Put your phone at the umpire end to record the live feed — review cuts the last delivery.'
              }
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  camOn ? 'animate-pulse bg-rose-500' : 'bg-white/35',
                )}
              />
              {camSaving ? 'SAVING…' : camOn ? `REC ${Math.round(camSeconds)}s` : camErr ? 'CAM ERR' : 'UMPIRE CAM'}
            </button>
            {slow && (
              <StatusPill tone="teal">Slow-Mo ×0.22</StatusPill>
            )}
            <StatusPill tone={playing ? 'rose' : 'muted'}>
              {playing ? 'Recording' : 'Paused'}
            </StatusPill>
          </div>
        </div>

        {/* Live preview now lives in the Umpire Camera sidebar panel */}

        <div className="relative px-2 pb-2 sm:px-4">
          <style>{`
            @keyframes turf-ring { from { r: 2; opacity: 0.9; } to { r: 30; opacity: 0; } }
            @keyframes turf-dust { from { opacity: 0.85; } to { opacity: 0; } }
            @keyframes turf-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
            .turf-ring { animation: turf-ring 0.65s cubic-bezier(0.22, 0.61, 0.36, 1) forwards; }
            .turf-dust { animation: turf-dust 0.7s ease-out forwards; }
            .turf-pulse { animation: turf-pulse 1.8s ease-in-out infinite; }
          `}</style>
          <svg
            viewBox="0 0 640 360"
            className="h-auto w-full rounded-xl border border-foreground/10"
            role="img"
            aria-label="Umpire end camera view of the delivery"
          >
            <defs>
              <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#060a14" />
                <stop offset="55%" stopColor="#0b1020" />
                <stop offset="100%" stopColor="#141d39" />
              </linearGradient>
              <linearGradient id={groundId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#11301f" />
                <stop offset="55%" stopColor="#0c2419" />
                <stop offset="100%" stopColor="#081a11" />
              </linearGradient>
              <radialGradient id={gradientId}>
                <stop offset="0%" stopColor="#f2707c" />
                <stop offset="65%" stopColor="#cd3330" />
                <stop offset="100%" stopColor="#7d1a1f" />
              </radialGradient>
              <radialGradient id={pitchGlowId}>
                <stop offset="0%" stopColor="rgba(64,255,196,0.16)" />
                <stop offset="100%" stopColor="rgba(64,255,196,0)" />
              </radialGradient>
              <radialGradient id={wicketGlowId}>
                <stop offset="0%" stopColor="rgba(94,234,212,0.55)" />
                <stop offset="100%" stopColor="rgba(94,234,212,0)" />
              </radialGradient>
              <filter id={trailBlurId} x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur stdDeviation="2.5" />
              </filter>
            </defs>

            {/* Sky */}
            <rect width="640" height="360" fill={`url(#${skyId})`} />

            {/* Stands / distant lights */}
            {crowdDots.map((dot) => (
              <circle
                key={`${dot.x}-${dot.y}`}
                cx={dot.x}
                cy={dot.y}
                r={dot.r}
                fill="rgba(188,224,206,0.5)"
                opacity={dot.o}
              />
            ))}

            {/* Sight screen behind the batter */}
            <rect x="252" y="96" width="136" height="54" rx="3" fill="#101a2e" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
            <rect x="260" y="103" width="120" height="38" rx="2" fill="#1c2a48" />
            <text
              x="320"
              y="127"
              textAnchor="middle"
              fill="rgba(255,255,255,0.5)"
              fontSize="8.5"
              fontWeight="600"
              letterSpacing="2.5"
            >
              SIGHT SCREEN
            </text>

            {/* Horizon + ground */}
            <line x1="0" y1="124" x2="640" y2="124" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <rect x="0" y="124" width="640" height="236" fill={`url(#${groundId})`} />

            {/* Pitch — receding towards the batter */}
            <polygon
              points="306,128 334,128 404,352 236,352"
              fill="rgba(128,171,117,0.30)"
              stroke="rgba(176,224,167,0.22)"
              strokeWidth="1.5"
            />
            <polygon points="312,128 328,128 376,352 264,352" fill="rgba(146,188,132,0.20)" />
            <line x1="320" y1="128" x2="320" y2="352" stroke="rgba(255,255,255,0.07)" strokeWidth="3" />

            {/* Creases — batting + return lines, far and near */}
            <line x1="300" y1="150" x2="340" y2="150" stroke="rgba(240,246,232,0.55)" strokeWidth="1.6" />
            <line x1="296" y1="141" x2="344" y2="141" stroke="rgba(240,246,232,0.28)" strokeWidth="1.2" />
            <line x1="298" y1="159" x2="288" y2="167" stroke="rgba(240,246,232,0.32)" strokeWidth="1.2" />
            <line x1="342" y1="159" x2="352" y2="167" stroke="rgba(240,246,232,0.32)" strokeWidth="1.2" />
            <line x1="238" y1="322" x2="402" y2="322" stroke="rgba(240,246,232,0.5)" strokeWidth="1.6" />
            <line x1="240" y1="307" x2="400" y2="307" stroke="rgba(240,246,232,0.28)" strokeWidth="1.2" />

            {/* Far (batter) stumps + bails */}
            <g strokeLinecap="round">
              <line x1="312" y1="128" x2="312" y2="141" stroke="#ecc391" strokeWidth="1.5" />
              <line x1="320" y1="128" x2="320" y2="141" stroke="#ecc391" strokeWidth="1.5" />
              <line x1="328" y1="128" x2="328" y2="141" stroke="#ecc391" strokeWidth="1.5" />
            </g>
            <line x1="310" y1="128" x2="330" y2="128" stroke="#f6dea8" strokeWidth="1.5" strokeLinecap="round" />

            {/* Batter shadow + figure (far end, backlift) */}
            <g
              style={{
                transformOrigin: '320px 142px',
                transition: 'transform 0.2s ease-out',
              }}
              transform={batSwinging ? 'rotate(-30 320 142)' : 'rotate(4 320 142)'}
            >
              <line x1="318" y1="142" x2="315" y2="152" stroke="#c3cede" strokeWidth="2" strokeLinecap="round" />
              <line x1="322" y1="142" x2="325" y2="152" stroke="#c3cede" strokeWidth="2" strokeLinecap="round" />
              <line x1="320" y1="142" x2="320" y2="130" stroke="#e6e9ef" strokeWidth="3" strokeLinecap="round" />
              <circle cx="320" cy="127" r="3.4" fill="#0d1230" />
              <line x1="322" y1="134" x2="337" y2="119" stroke="#d9b98c" strokeWidth="2.2" strokeLinecap="round" />
            </g>
            <ellipse cx="320" cy="152" rx="7" ry="1.5" fill="rgba(0,0,0,0.4)" />

            {/* Wicketkeeper crouched behind */}
            <g opacity="0.85">
              <ellipse cx="344" cy="147" rx="4.5" ry="1.2" fill="rgba(0,0,0,0.35)" />
              <line x1="344" y1="147" x2="344" y2="139" stroke="#c9d2e0" strokeWidth="1.7" strokeLinecap="round" />
              <circle cx="344" cy="137" r="2" fill="#0d1230" />
            </g>

            {/* Bowler in delivery stride (near end, cropped) */}
            <g opacity="0.94">
              <line x1="313" y1="332" x2="300" y2="360" stroke="#161c30" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="319" y1="332" x2="338" y2="360" stroke="#161c30" strokeWidth="4.5" strokeLinecap="round" />
              <line x1="316" y1="332" x2="309" y2="262" stroke="#263049" strokeWidth="5.5" strokeLinecap="round" />
              <line x1="309" y1="274" x2="330" y2="248" stroke="#1a2140" strokeWidth="3.2" strokeLinecap="round" />
              <line x1="309" y1="282" x2="322" y2="300" stroke="#1a2140" strokeWidth="3.2" strokeLinecap="round" />
              <circle cx="307" cy="256" r="5.5" fill="#0b1020" />
            </g>

            {/* Near (bowler) stumps, cropped at the bottom edge */}
            <g>
              <line x1="306" y1="352" x2="306" y2="368" stroke="#c98f5f" strokeWidth="6" strokeLinecap="round" />
              <line x1="318" y1="352" x2="318" y2="368" stroke="#c98f5f" strokeWidth="6" strokeLinecap="round" />
              <line x1="330" y1="352" x2="330" y2="368" stroke="#c98f5f" strokeWidth="6" strokeLinecap="round" />
              <line x1="303" y1="352" x2="333" y2="352" stroke="#e7b27d" strokeWidth="3" strokeLinecap="round" />
            </g>

            {/* Soft light pool under the moving ball */}
            <ellipse
              cx="320"
              cy={(pos ? pos.y : 206) + 20}
              rx="90"
              ry="34"
              fill={`url(#${pitchGlowId})`}
              opacity={pos ? 0.5 : 0}
            />

            {/* Trajectory — traced as the ball travels, fades once done */}
            {pos && progress > 0.04 && (
              <g opacity={isDone ? 0.4 : 1}>
                <polyline
                  points={trail}
                  fill="none"
                  stroke="rgba(94,234,212,0.55)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#${trailBlurId})`}
                />
                <polyline
                  points={trail}
                  fill="none"
                  stroke="rgba(196,255,242,0.9)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            )}

            {/* Pitch impact — ring + dust the moment the ball bounces */}
            {justBounced && (
              <g key={`bounce-${index}-${seq}`}>
                <circle
                  cx={BOUNCE.x}
                  cy={BOUNCE.y}
                  r="4"
                  fill="none"
                  stroke="rgba(244,250,236,0.95)"
                  strokeWidth="1.6"
                  className="turf-ring"
                />
                <ellipse cx={BOUNCE.x} cy={BOUNCE.y} rx="11" ry="4" fill="rgba(214,228,196,0.4)" className="turf-dust" />
                <ellipse cx={BOUNCE.x} cy={BOUNCE.y - 7} rx="7" ry="3" fill="rgba(214,228,196,0.22)" className="turf-dust" style={{ animationDelay: '0.08s' }} />
              </g>
            )}

            {/* LBW projection + umpire call markers (once the ball has pitched) */}
            {showLbwOverlay && delivery.outcome === 'lbw' && (
              <g key={`overlay-${index}-${seq}`}>
                {/* Projected path — flat, dotted continuation toward the stumps */}
                <line
                  x1={BOUNCE.x}
                  y1={BOUNCE.y}
                  x2={projectionEnd.x}
                  y2={projectionEnd.y}
                  stroke="rgba(94,234,212,0.75)"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                />
                <circle cx={projectionEnd.x} cy={projectionEnd.y} r="2.4" fill="#5eead4" />

                {/* Soft wicket highlight when the projection hits */}
                <ellipse
                  cx="320"
                  cy="136"
                  rx="30"
                  ry="18"
                  fill={`url(#${wicketGlowId})`}
                  className="turf-pulse"
                />
                <g strokeLinecap="round">
                  <line x1="311" y1="128" x2="311" y2="141" stroke="rgba(255,226,173,0.95)" strokeWidth="1.6" />
                  <line x1="320" y1="128" x2="320" y2="141" stroke="rgba(255,226,173,0.95)" strokeWidth="1.6" />
                  <line x1="329" y1="128" x2="329" y2="141" stroke="rgba(255,226,173,0.95)" strokeWidth="1.6" />
                </g>
                <line x1="309" y1="128" x2="331" y2="128" stroke="rgba(255,244,214,0.95)" strokeWidth="1.6" strokeLinecap="round" />

                {/* "IMPACT · IN LINE" call anchored at the pitch mark */}
                <line x1="327" y1="202" x2="364" y2="196" stroke="rgba(231,245,216,0.55)" strokeWidth="1" strokeDasharray="2 2" />
                <rect x="368" y="188" width="128" height="19" rx="4" fill="rgba(11,11,20,0.72)" stroke="rgba(231,245,216,0.22)" strokeWidth="0.8" />
                <text x="376" y="202" fill="#eef7df" fontSize="9.5" fontWeight="600" letterSpacing="1.2">
                  IMPACT · IN LINE
                </text>

                {/* Wicket projection verdict chip */}
                <rect x="296" y="74" width="204" height="24" rx="6" fill="rgba(11,11,20,0.85)" stroke="rgba(251,113,133,0.4)" strokeWidth="1" />
                <text x="398" y="90" textAnchor="middle" fill="#fda4af" fontSize="10.5" fontWeight="700" letterSpacing="1.6">
                  WICKET PROJECTION · HITTING
                </text>
              </g>
            )}

            {/* LBW impact flash on the pad */}
            {justImpacted && (
              <g key={`impact-${index}-${seq}`}>
                <circle
                  cx={PAD.x}
                  cy={PAD.y}
                  r="6"
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="1.7"
                  className="turf-ring"
                />
                <circle cx={PAD.x} cy={PAD.y - 5} r="2" fill="rgba(251,113,133,0.85)" className="turf-dust" />
              </g>
            )}

            {/* Ball + travelling shadow */}
            {pos && !(delivery.outcome === 'lbw' && isDone) && (
              <g>
                <ellipse
                  cx={shadow.x}
                  cy={shadow.y}
                  rx={ballRadius * 1.05}
                  ry={ballRadius * 0.5}
                  fill="rgba(0,0,0,0.45)"
                  filter={`url(#${trailBlurId})`}
                />
                <circle cx={pos.x} cy={pos.y} r={ballRadius} fill={`url(#${gradientId})`} stroke="rgba(255,255,255,0.55)" strokeWidth="0.9" />
                <circle cx={pos.x - ballRadius * 0.3} cy={pos.y - ballRadius * 0.35} r={ballRadius * 0.32} fill="rgba(255,255,255,0.45)" />
                {progress > 0.06 && (
                  <circle
                    cx={deliveryPosition(delivery.outcome, progress - 0.035).x}
                    cy={deliveryPosition(delivery.outcome, progress - 0.035).y}
                    r={ballRadius * 0.75}
                    fill="#6ee7ff"
                    opacity={0.28}
                  />
                )}
              </g>
            )}

            {/* LBW settled on the pad at the end */}
            {delivery.outcome === 'lbw' && isDone && (
              <g>
                <circle cx={PAD.x} cy={PAD.y} r="4" fill="#fb7185" opacity="0.85" />
                <circle cx={PAD.x} cy={PAD.y} r="21" fill="none" stroke="#fb7185" strokeWidth="1.5" opacity="0.5" />
              </g>
            )}
          </svg>

          {/* REVIEW badge on the review delivery */}
          {delivery.outcome === 'lbw' && (
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 shadow-lg backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400 turf-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-200">
                Review
              </span>
            </div>
          )}

          {/* Consequence overlay */}
          {isDone && (
            <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
              <div className="flex items-center gap-2 rounded-full border border-foreground/10 bg-[#0b0b14]/90 px-4 py-2 shadow-xl backdrop-blur-md">
                <span
                  className={cn(
                    'text-xs font-semibold uppercase tracking-widest',
                    delivery.outcome === 'lbw'
                      ? 'text-rose-300'
                      : delivery.outcome === 'run'
                        ? 'text-teal-300'
                        : 'text-muted-foreground',
                  )}
                >
                  {delivery.result}
                </span>
                <span className="text-xs text-muted-foreground">· {delivery.over}</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom transport + request review */}
        <div className="flex flex-wrap items-center justify-center gap-2 border-t border-foreground/5 px-5 py-4">
          <button
            type="button"
            onClick={togglePlay}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40"
            title={playing ? 'Pause' : 'Play'}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => replay()}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-transparent px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            title="Replay last ball"
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Replay Last Ball</span>
          </button>

          <button
            type="button"
            onClick={() => setSlow((value) => !value)}
            aria-pressed={slow}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all',
              slow
                ? 'border-teal-500/40 bg-teal-500/10 text-teal-300 ring-1 ring-teal-500/25'
                : 'border-foreground/10 bg-transparent text-muted-foreground hover:text-foreground',
            )}
            title="Slow motion"
          >
            <Gauge className="h-4 w-4" />
            <span className="hidden sm:inline">Slow Motion</span>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => stepBall(-1)}
              disabled={index === 0}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/10 bg-transparent text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              title="Previous ball"
              aria-label="Previous delivery"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="w-14 text-center text-sm font-semibold tabular-nums text-foreground">
              {delivery.over}
            </span>
            <button
              type="button"
              onClick={() => stepBall(1)}
              disabled={index === DELIVERIES.length - 1}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-foreground/10 bg-transparent text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
              title="Next ball"
              aria-label="Next delivery"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => router.push('/reviews')}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-transparent px-4 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            title="Review history"
          >
            <ShieldAlert className="h-4 w-4" />
            <span className="hidden sm:inline">Review History</span>
          </button>

          <button
            type="button"
            onClick={requestReview}
            disabled={reviewedBall === 'OUT' && delivery.outcome === 'lbw'}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-rose-500/10 px-5 text-sm font-semibold text-rose-300 shadow-lg shadow-rose-500/20 ring-1 ring-rose-500/30 transition-all hover:bg-rose-500/15 hover:shadow-rose-500/30 disabled:opacity-40"
            title={delivery.outcome === 'lbw' ? 'Open LBW review' : 'Request a review'}
          >
            <ShieldAlert className="h-4 w-4" />
            REQUEST REVIEW
          </button>
        </div>

        <p className="border-t border-foreground/5 px-5 py-3 text-center text-xs text-muted-foreground">
          {delivery.description}
        </p>
      </div>

      {/* Umpire camera — live recording + last-ball upload */}
      <div className="flex flex-col overflow-hidden rounded-2xl border border-foreground/10 bg-[#0b0b14]/90 shadow-xl shadow-black/30">
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 ring-1 ring-rose-500/25">
              <Video className="h-4 w-4 text-rose-300" />
            </span>
            <div>
              <h3 className="text-sm font-semibold tracking-tight text-foreground">Umpire Camera</h3>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Live recording · last ball</p>
            </div>
          </div>
          {camOn && (
            <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-rose-300 ring-1 ring-rose-500/30">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
              {Math.round(camSeconds)}s
            </span>
          )}
        </div>

        <div className="px-5 pb-4">
          <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-foreground/10 bg-black">
            {camOn && camStream ? (
              <video ref={camPreviewRef} autoPlay muted playsInline className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Camera className="h-6 w-6 text-muted-foreground/50" />
                <p className="px-8 text-[11px] leading-relaxed text-muted-foreground">
                  Point your phone at the umpire end with a clear view of the pitch, then press Record.
                </p>
              </div>
            )}
            {camOn && camStream && (
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded bg-black/70 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-rose-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                Umpire cam
              </span>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={toggleCam}
              disabled={camSaving || Boolean(camErr)}
              className={cn(
                'inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-colors disabled:opacity-40',
                camOn
                  ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40 hover:bg-rose-500/25'
                  : 'bg-teal-500/10 text-teal-300 ring-1 ring-teal-400/30 hover:bg-teal-500/20',
              )}
            >
              {camOn ? (
                <>
                  <span className="h-2 w-2 rounded-sm bg-rose-400" /> STOP
                </>
              ) : (
                <>
                  <Camera className="h-3.5 w-3.5" /> RECORD
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => captureLastDelivery(15)}
              disabled={camSaving || !camOn}
              className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg border border-foreground/10 px-3 text-xs font-medium text-foreground/80 transition-colors hover:border-rose-500/30 hover:text-rose-300 disabled:opacity-40"
              title="Cut the last 15 seconds of the rolling capture and save this delivery"
            >
              {camSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {camSaving ? 'UPLOADING…' : 'UPLOAD LAST BALL'}
            </button>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            {camOn ? (
              <>
                Rolling capture stays on —{' '}
              <span className="text-rose-300">review or upload cuts the last 15 seconds</span>{' '}
              and keeps recording for the next delivery.
              </>
            ) : (
              <>Start recording before the ball is bowled so the last delivery can be cut and uploaded.</>
            )}
          </p>

          {camErr && !camOn && <p className="mt-2 text-[11px] text-rose-300">{camErr}</p>}

          {camUpload && (
            <div
              className={cn(
                'mt-2 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs',
                camUpload.status === 'done'
                  ? 'border-emerald-500/30 bg-emerald-500/[0.05] text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/[0.05] text-rose-300',
              )}
            >
              {camUpload.status === 'done' ? (
                <Check className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <X className="h-3.5 w-3.5 shrink-0" />
              )}
              {camUpload.status === 'done' ? (
                <>
                  Ball {camUpload.ball} clip — {camUpload.message}
                </>
              ) : (
                <>{camUpload.message}</>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Ball by ball panel */}
      <div className="flex flex-col rounded-2xl border border-foreground/10 bg-[#0b0b14]/90 shadow-xl shadow-black/30">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">Ball by Ball</h3>
            <span className="rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Over 16
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="text-2xl font-semibold tracking-tight text-foreground">
              {runs}/{wickets}
            </p>
            <p className="text-xs text-muted-foreground">48 off 21</p>
            {reviewedBall && (
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest',
                  reviewedBall === 'OUT'
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
                )}
              >
                {reviewedBall}
              </span>
            )}
          </div>
        </div>

        {lastReview && (
          <div className="border-t border-teal-500/20 bg-teal-500/[0.04] px-5 py-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-widest text-teal-300">
                {lastReview.ballId}
              </span>{' '}
              {lastReview.type === 'lbw' ? 'LBW' : lastReview.type} review —{' '}
              <span
                className={cn(
                  'font-semibold',
                  lastReview.decision === 'OUT' ? 'text-rose-300' : 'text-emerald-300',
                )}
              >
                {lastReview.decision}
              </span>
              <span className="ml-1 text-muted-foreground/60">• {lastReview.status.toLowerCase()}</span>
            </p>
          </div>
        )}

        <div className="flex-1 space-y-1 px-3 pb-3">
          {DELIVERIES.map((item, i) => {
            const active = i === index;
            return (
              <button
                key={item.over}
                type="button"
                onClick={() => replay(i)}
                aria-pressed={active}
                className={cn(
                  'flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-all',
                  active
                    ? 'border-teal-500/40 bg-teal-500/[0.06] ring-1 ring-teal-500/25'
                    : 'border-foreground/10 bg-foreground/[0.02] hover:border-teal-500/25',
                )}
              >
                <span className="flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-lg font-mono text-xs font-semibold',
                      active ? 'bg-teal-500/15 text-teal-300' : 'bg-foreground/[0.04] text-muted-foreground',
                    )}
                  >
                    {item.over}
                  </span>
                  <span className="text-sm font-medium text-foreground">{item.result}</span>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'hidden rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-widest sm:inline-block',
                      RESULT_TONE[item.outcome],
                    )}
                  >
                    {item.outcome === 'beat' ? 'Dot' : item.outcome === 'run' ? 'Scored' : 'Appeal'}
                  </span>
                  {item.outcome === 'lbw' && (
                    <>
                      <span className="rounded-full border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-rose-300">
                        Review
                      </span>
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 turf-pulse" />
                    </>
                  )}
                  {lastReview?.ballId === item.over && (
                    <span
                      className={cn(
                        'rounded-full border px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-widest',
                        lastReview.decision === 'OUT'
                          ? 'border-rose-500/30 bg-rose-500/10 text-rose-300'
                          : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
                      )}
                    >
                      {lastReview.decision}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      </div>

      <ReviewFlowOverlay
        open={reviewOpen}
        over={delivery.over}
        auto={demo}
        onClose={() => setReviewOpen(false)}
        onDecision={goReview}
      />
    </>
  );
}