'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Camera, Check, Gauge, ScanLine, Sparkles, Video, X } from 'lucide-react';

const STAGES = [
  {
    key: 'capturing',
    eyebrow: 'Capture',
    title: 'Delivery captured at the umpire end.',
    glow: '192,132,252',
  },
  {
    key: 'pitchmap',
    eyebrow: 'Ball tracking',
    title: 'Building the trajectory map…',
    glow: '167,139,250',
  },
  {
    key: 'analysis',
    eyebrow: 'Review',
    title: 'Checking impact, height, and ball path',
    glow: '34,211,238',
  },
  {
    key: 'evidence',
    eyebrow: 'Slow motion',
    title: 'Playing back the evidence frame by frame',
    glow: '52,211,153',
  },
  {
    key: 'ready',
    eyebrow: 'Decision',
    title: 'Decision: NOT OUT',
    glow: '45,212,191',
  },
] as const;

const DEMO_EVIDENCE = [
  { id: 'impact', label: 'Impact point', value: 'In line', color: 'text-cyan-300' },
  { id: 'tracking', label: 'Ball tracking', value: 'Heading for off stump', color: 'text-violet-300' },
  { id: 'height', label: 'Height at impact', value: 'Above stumps', color: 'text-amber-300' },
  { id: 'stumps', label: 'Wickets', value: 'Bails intact', color: 'text-emerald-300' },
] as const;

const STAGE_MS = 1500;
const LAST_STAGE = STAGES.length - 1;

export function DemoModal({
  open,
  onOpenChange,
  onGetStack,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetStack: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(reduceMotion ? LAST_STAGE : 0);
  const closeRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setStage(reduceMotion ? LAST_STAGE : 0);
    closeRef.current?.focus();
  }, [open, reduceMotion]);

  useEffect(() => {
    if (!open || reduceMotion || stage >= LAST_STAGE) return;
    const timer = setTimeout(() => setStage((value) => Math.min(value + 1, LAST_STAGE)), STAGE_MS);
    return () => clearTimeout(timer);
  }, [open, stage, reduceMotion]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = Array.from(
        rootRef.current?.querySelectorAll<HTMLElement>('[tabindex]:not([tabindex="-1"]), button, a') ??
          [],
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const current = STAGES[stage];

  const handleGetStack = () => {
    close();
    onGetStack();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
          onClick={close}
        >
          <motion.div
            ref={rootRef}
            role="dialog"
            aria-modal="true"
            aria-label="Turf DRS demo"
            initial={{ opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className="glass relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0b0b14]/90 p-6 sm:p-8"
          >
            <div className="pointer-events-none absolute inset-0">
              <div
                aria-hidden="true"
                className="absolute left-1/2 top-0 h-56 w-96 -translate-x-1/2 rounded-full blur-[90px]"
                style={{
                  background: `radial-gradient(circle, rgba(${current.glow}, 0.16), transparent 70%)`,
                }}
              />
            </div>

            <div className="relative flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Turf DRS Demo
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close demo"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/10 text-muted-foreground transition-colors hover:border-teal-500/30 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-8 min-h-[300px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={current.key}
                  initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                  aria-live="polite"
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-2xl ring-1 ring-foreground/10"
                      style={{
                        background: `linear-gradient(135deg, rgba(${current.glow}, 0.25), rgba(${current.glow}, 0.06))`,
                      }}
                    >
                      {stage === 0 && <Camera className="h-6 w-6 text-purple-300" />}
                      {stage === 1 && <ScanLine className="h-6 w-6 text-violet-300" />}
                      {stage === 2 && <Gauge className="h-6 w-6 text-cyan-300" />}
                      {stage === 3 && <Video className="h-6 w-6 text-emerald-300" />}
                      {stage === 4 && <Check className="h-6 w-6 text-teal-300" />}
                    </div>
                    <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      {current.eyebrow}
                    </p>
                    <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground sm:text-xl">
                      {current.title}
                    </h3>
                  </div>

                  {stage >= 2 && stage < 4 && (
                    <div className="mx-auto mt-7 flex max-w-sm flex-col gap-2.5">
                      {DEMO_EVIDENCE.map((evidence, index) => (
                        <motion.div
                          key={evidence.id}
                          initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.08 }}
                          className="rounded-xl border border-foreground/8 bg-foreground/[0.02] px-3 py-2"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/[0.04] ring-1 ring-foreground/10">
                              <ScanLine className="h-3.5 w-3.5 text-teal-400" />
                            </span>
                            <span className="flex-1 truncate text-xs font-medium text-foreground">
                              {evidence.label}
                            </span>
                            <span
                              className={`truncate text-[10px] font-medium ${evidence.color}`}
                            >
                              {evidence.value}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {stage >= 4 && (
                    <div className="mx-auto mt-6 flex flex-col items-center gap-3">
                      <p className="max-w-xs text-xs leading-relaxed text-muted-foreground">
                        Too high — bails intact. Turf DRS keeps the decision fair with clear visual
                        evidence.
                      </p>
                      <button
                        type="button"
                        onClick={handleGetStack}
                        className="inline-flex items-center gap-2 rounded-full bg-teal-500 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 active:scale-95"
                      >
                        <Sparkles className="h-4 w-4" />
                        Start a Live Review
                      </button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative mt-8 flex items-center justify-center gap-1.5">
              {STAGES.map((item, index) => (
                <span
                  key={item.key}
                  aria-hidden="true"
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === stage ? 'w-6 bg-teal-400' : 'w-1.5 bg-foreground/20'
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}