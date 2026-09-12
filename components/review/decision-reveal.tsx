'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Radar, RotateCcw, ShieldAlert } from 'lucide-react';
import type { Decision, ReviewTypeId } from '@/lib/drs/types';
import { reasonFor } from '@/lib/drs/demo-service';

const LABELS: Record<ReviewTypeId, string> = {
  lbw: 'LBW',
  caught: 'CAUGHT BEHIND',
  runout: 'RUN OUT',
  stumping: 'STUMPING',
  boundary: 'BOUNDARY',
};

export const DECISION_OPTIONS: Decision[] = ['OUT', 'NOT OUT', 'INCONCLUSIVE'];

export function DecisionReveal({
  type,
  decision,
  onDecision,
  onReturn,
  onReset,
  returning = false,
}: {
  type: ReviewTypeId;
  decision: Decision;
  onDecision: (decision: Decision) => void;
  onReturn: () => void;
  onReset: () => void;
  returning?: boolean;
}) {
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<'complete' | 'verdict' | 'actions'>('complete');
  const [decisionKey, setDecisionKey] = useState(0);

  const out = decision === 'OUT';
  const inconclusive = decision === 'INCONCLUSIVE';
  const color = inconclusive ? '#fbbf24' : out ? '#fb7185' : '#34d399';
  const glow = `0 0 42px ${color}77, 0 0 96px ${color}44`;
  const label = LABELS[type];

  useEffect(() => {
    const timers: number[] = [
      window.setTimeout(() => setStage('verdict'), 1500),
      window.setTimeout(() => setStage('actions'), 2400),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, []);

  useEffect(() => {
    if (stage !== 'verdict') return;
    setDecisionKey((value) => value + 1);
  }, [decision, stage]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === '1' || event.key === '2' || event.key === '3') {
        onDecision(DECISION_OPTIONS[Number(event.key) - 1]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onDecision]);

  return (
    <div className="relative z-30 flex min-h-[420px] flex-col items-center justify-between px-4 py-5 text-center sm:min-h-[460px] sm:py-8">
      {/* Broadcast scan sweep */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
        <motion.div
          initial={{ y: '-10%' }}
          animate={{ y: '110%' }}
          transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 0.6 }}
          className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-transparent via-emerald-400/10 to-transparent blur-md"
        />

        <AnimatePresence>
          {stage === 'complete' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1.4, opacity: [0, 0.8, 0] }}
                exit={{ opacity: 0, scale: 1.6 }}
                transition={{ duration: 1.2, repeat: Infinity }}
                className="h-56 w-56 rounded-full border border-emerald-400/40"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${stage}-${decisionKey}`}
          initial={reduce ? false : { opacity: 0, scale: stage === 'verdict' ? 0.72 : 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="relative flex w-full flex-1 flex-col items-center justify-center text-center"
        >
          {stage === 'complete' && (
            <>
              <motion.span
                initial={reduce ? false : { opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 16 }}
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 shadow-[0_0_48px_rgba(52,211,153,0.25)]"
              >
                <Radar className="h-8 w-8 text-emerald-300" />
              </motion.span>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.42em] text-white/60 sm:text-sm"
              >
                Third Umpire Review Complete
              </motion.p>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.65, duration: 0.7, ease: 'easeOut' }}
                className="mt-4 h-0.5 w-56 origin-center bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent sm:w-72"
              />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.75, duration: 0.5 }}
                className="mt-4 font-mono text-xs font-bold uppercase tracking-[0.3em] text-white/45 sm:text-sm"
              >
                {label} · FALC vs STR · Ball 16.4
              </motion.p>
            </>
          )}

          {stage !== 'complete' && (
            <>
              <motion.span
                initial={reduce ? false : { letterSpacing: '0.6em', opacity: 0 }}
                animate={{ letterSpacing: '0.26em', opacity: 1 }}
                transition={{ duration: 0.55 }}
                className="font-mono text-xs font-bold uppercase text-white/70 sm:text-base"
              >
                {label} · Decision
              </motion.span>

              {/* Verdict — fade + scale + subtle glow */}
              <motion.div
                key={decision}
                initial={reduce ? false : { opacity: 0, scale: 0.4, filter: 'blur(10px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                transition={{ delay: 0.25, type: 'spring', stiffness: 190, damping: 15 }}
                className="relative mt-5 sm:mt-7"
                style={{ textShadow: glow }}
              >
                <motion.div
                  animate={{ opacity: [0.25, 0.7, 0.25] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -inset-6 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${color}26 0%, transparent 70%)`,
                    filter: 'blur(10px)',
                  }}
                />
                <span
                  className="relative inline-block rounded-2xl border px-7 py-3 font-mono text-5xl font-black uppercase tracking-[0.12em] sm:px-10 sm:py-4 sm:text-7xl"
                  style={{
                    borderColor: `${color}66`,
                    background: `linear-gradient(180deg, ${color}1a, ${color}05)`,
                    color,
                    textShadow: glow,
                    boxShadow: `0 0 60px ${color}33`,
                  }}
                  aria-live="polite"
                >
                  {decision}
                </span>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.3em] text-white/40">
                  {reasonFor(type, decision)}
                </p>
              </motion.div>
            </>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.4 }}
        className="relative mt-8 w-full"
      >
        {stage === 'complete' ? (
          <p className="font-mono text-[9px] uppercase tracking-[0.32em] text-emerald-400/70">
            Deciding the verdict…
          </p>
        ) : (
          <div className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onReset}
              disabled={returning}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-6 text-sm font-semibold text-white/80 transition-all hover:border-amber-400/40 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              Reset Review
            </button>
            <button
              type="button"
              onClick={onReturn}
              disabled={returning}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60"
            >
              {returning ? (
                <RotateCcw className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
              Open Live Match
            </button>
          </div>
        )}

        {stage === 'actions' && (
          <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[10px] text-white/35">
            <ShieldAlert className="h-3 w-3" />
            Decision logged to Review History when you open the live match.
          </p>
        )}
      </motion.div>
    </div>
  );
}

export function ReviewTypeTag({ type }: { type: ReviewTypeId }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-amber-300">
      <ShieldAlert className="h-3 w-3" />
      {type}
    </span>
  );
}