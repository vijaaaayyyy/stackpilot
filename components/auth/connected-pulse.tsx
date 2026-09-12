'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { TurfLogo } from '@/components/landing/brand-logo';

/**
 * Grok-style "connected" pulse shown right after sign-in (email or OAuth).
 * A pulsing glow blooms around the app mark, then the confirmation text and a
 * dark action button fade in. Advances automatically so new users are never
 * stuck on a dead screen.
 */
export function ConnectedPulse({
  next = '/dashboard',
  autoAdvanceMs = 4600,
}: {
  next?: string;
  autoAdvanceMs?: number;
}) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [stage, setStage] = useState<'pulse' | 'text' | 'actions'>('pulse');

  const destination = useMemo(() => (next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard'), [next]);
  const continueLabel = useMemo(() => {
    if (destination === '/dashboard') return 'Go to Dashboard';
    if (destination.startsWith('/search')) return `Resume your search`;
    const step = destination.split('?')[0].replace(/\/+$/, '');
    return `Continue to ${step.split('/').filter(Boolean).slice(-1)[0]?.replace(/-/g, ' ') || 'Dashboard'}`;
  }, [destination]);

  const continueTo = () => {
    router.replace(destination);
    router.refresh();
  };

  useEffect(() => {
    const timers: number[] = [
      window.setTimeout(() => setStage('text'), 1000),
      window.setTimeout(() => setStage('actions'), 1800),
      window.setTimeout(continueTo, autoAdvanceMs),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdvanceMs]);

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#030509]/70 backdrop-blur-md sm:items-center sm:p-6"
      aria-live="polite"
    >
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-t-3xl border border-white/10 bg-[#0b0f18] px-8 pb-6 pt-12 text-center shadow-[0_0_80px_rgba(20,184,166,0.12)] sm:rounded-3xl"
      >
        {/* Soft top glow */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-teal-400/[0.07] to-transparent" />

        {/* Pulsing mark */}
        <div className="relative flex h-24 w-24 items-center justify-center">
          {/* Ambient pulse glow */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0.5, 0.9, 0.5], scale: [0.95, 1.05, 0.95] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-3 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(45,212,191,0.28) 0%, transparent 68%)',
              filter: 'blur(6px)',
            }}
          />
          {/* Expanding ring */}
          <motion.div
            aria-hidden="true"
            initial={{ scale: 0.8, opacity: 0.7 }}
            animate={{ scale: [0.9, 1.5, 1.9], opacity: [0.6, 0.25, 0] }}
            transition={{ duration: 1.9, repeat: Infinity, ease: 'easeOut' }}
            className="absolute h-20 w-20 rounded-full border border-teal-300/50"
          />
          <motion.div
            initial={reduce ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 220, damping: 16 }}
            className="flex h-20 w-20 items-center justify-center rounded-2xl border border-teal-400/30 bg-teal-400/10 shadow-[0_0_48px_rgba(45,212,191,0.3)]"
          >
            <TurfLogo className="h-10 w-10 text-teal-300" />
          </motion.div>
        </div>

        {/* Confirmation text */}
        <AnimatePresence>
          {stage !== 'pulse' && (
            <div className="mt-7 w-full">
              <motion.h1
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="text-2xl font-bold tracking-tight text-white"
              >
                You&apos;re connected
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.5 }}
                className="mt-2 text-sm leading-relaxed text-white/55"
              >
                Turf DRS is ready — matches, third-umpire reviews and slow-mo footage are waiting for you.
              </motion.p>
            </div>
          )}
        </AnimatePresence>

        {/* Action details + dark button */}
        <AnimatePresence>
          {stage === 'actions' && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="mt-7 w-full"
            >
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-white/35">{continueLabel}</p>
              <button
                type="button"
                onClick={continueTo}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-[#0a0e16] transition-all hover:bg-teal-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                {continueLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}