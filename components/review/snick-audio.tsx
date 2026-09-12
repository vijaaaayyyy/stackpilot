'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import type { AudioAnalysis } from '@/lib/drs/types';

/**
 * Snickometer-style audio analysis panel (demo). Plots a fake waveform with a
 * clearly marked audio spike where bat-ball contact (demo) occurred.
 */
export function SnickAudio({
  data,
  playing = true,
  highlighted = false,
}: {
  data?: AudioAnalysis;
  playing?: boolean;
  highlighted?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const peakIndex = data ? Math.round((data.peakAtMs / data.durationMs) * 119) : 58;

  const bars = useMemo(() => {
    return Array.from({ length: 120 }, (_, i) => {
      const dist = Math.abs(i - peakIndex);
      let amplitude = 0.18 + Math.random() * 0.5;
      if (dist < 5) amplitude = 0.62 + (5 - dist) * 0.2;
      const bass = Math.sin(i * 0.9) * 0.22;
      return Math.min(1, amplitude + bass);
    });
  }, [peakIndex]);

  const [offset, setOffset] = useState(0);
  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => setOffset((value) => (value + 1) % 1000), 120);
    return () => window.clearInterval(id);
  }, [playing]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-lg border border-white/10 bg-[#0a0f1a]/90 p-3"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-teal-300 sm:text-[10px]">
            <Volume2 className="h-3 w-3" />
            Snickometer · Audio Analysis (Demo)
          </span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">
            48 kHz · {data ? `${(data.durationMs / 1000).toFixed(2)}s` : '1.20s'}
          </span>
        </div>

        <div className="mt-2.5 h-12 sm:h-14">
          <svg viewBox="0 0 120 40" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
            <line x1="0" y1="20" x2="120" y2="20" stroke="rgba(255,255,255,0.08)" />
            {bars.map((value, i) => {
              const active = highlighted && i === peakIndex;
              const near = highlighted && Math.abs(i - peakIndex) <= 2 && i !== peakIndex;
              const height = Math.max(1.5, value * (active ? 38 : 32));
              return (
                <rect
                  key={i}
                  x={i}
                  y={(40 - height) / 2}
                  width="0.82"
                  height={height}
                  rx="0.4"
                  fill={
                    active
                      ? '#fbbf24'
                      : near
                        ? 'rgba(251,191,36,0.45)'
                        : 'rgba(45,212,191,0.55)'
                  }
                  style={!reduceMotion ? { transition: `transform ${0.12}s` } : undefined}
                />
              );
            })}
            <motion.rect
              x={((offset % 1000) / 1000) * 120}
              width="0.5"
              height="40"
              fill="rgba(255,255,255,0.35)"
            />
          </svg>
        </div>

        <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] uppercase tracking-widest text-white/35">
          <span>00:00</span>
          {highlighted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-300 ring-1 ring-amber-400/30">
              <span className="h-1 w-1 animate-pulse rounded-full bg-amber-400" />
              CONTACT · {data ? `${data.peakAtMs}ms` : '640ms'}
            </span>
          )}
          <span>00:01</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}