'use client';

import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

/**
 * Live match card for the landing hero — the "YOUR MATCH" visualization.
 * Uses the same card container, glow, spacing, and entrance motion as the
 * original stack preview.
 */
export function StackPreview() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative mx-auto mt-16 w-full max-w-3xl">
      {/* Ambient glow behind the card */}
      <div className="pointer-events-none absolute inset-0 -z-10 blur-3xl">
        <div className="absolute left-8 top-6 h-40 w-40 rounded-full bg-purple-500/15" />
        <div className="absolute right-8 top-1/2 h-40 w-40 rounded-full bg-cyan-500/12" />
        <div className="absolute bottom-0 left-1/2 h-32 w-48 -translate-x-1/2 rounded-full bg-emerald-500/10" />
      </div>

      <div className="mb-5 flex items-center justify-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-muted-foreground">
          Your Match
        </p>
      </div>

      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 26, rotateX: -8 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0, rotateX: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: '1200px' }}
        className="w-full px-3 sm:px-0"
      >
        <div className="relative rounded-2xl border border-foreground/10 bg-[#0b0b14]/90 px-6 py-6 shadow-xl shadow-black/30 sm:px-8">
          <span
            aria-hidden="true"
            className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent"
          />

          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
              Hyderabad Turf League
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest text-rose-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" aria-hidden="true" />
              Live
            </span>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3 sm:gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-rose-500 text-sm font-bold text-white shadow-lg shadow-rose-500/20">
              F
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">Falcons</span>
            <span className="text-sm font-medium text-muted-foreground">vs</span>
            <span className="text-base font-semibold tracking-tight text-foreground">Strikers</span>
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-400 to-blue-600 text-sm font-bold text-white shadow-lg shadow-sky-500/20">
              S
            </span>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span className="text-base font-semibold tracking-tight text-foreground">142/5</span>
            <span aria-hidden="true" className="text-muted-foreground/40">
              •
            </span>
            <span>16.4 overs</span>
          </div>

          <div className="mt-6 flex justify-center">
            <Link
              href="/live"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40 active:scale-95"
            >
              OPEN LIVE MATCH
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}