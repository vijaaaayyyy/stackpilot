'use client';

import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Clock, History, Loader2, Play, ScanLine } from 'lucide-react';
import { useReviews } from '@/lib/drs/store';
import type { Decision, Review } from '@/lib/drs/types';
import { cn } from '@/lib/utils';

const TYPE_LABEL: Record<string, string> = {
  lbw: 'LBW',
  caught: 'Caught Behind',
  runout: 'Run Out',
  stumping: 'Stumping',
  boundary: 'Boundary',
};

function decisionStyle(decision: Decision | 'SIX') {
  if (decision === 'OUT') return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
  if (decision === 'NOT OUT' || decision === 'SIX') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  return 'border-amber-500/30 bg-amber-500/10 text-amber-300';
}

function statusLabel(status: Review['status']) {
  if (status === 'UPHELD') return { label: 'Upheld', classes: 'text-teal-300 bg-teal-500/10 ring-teal-500/25' };
  if (status === 'OVERTURNED') return { label: 'Overturned', classes: 'text-amber-300 bg-amber-500/10 ring-amber-500/25' };
  return { label: 'Inconclusive', classes: 'text-muted-foreground bg-foreground/[0.06] ring-foreground/15' };
}

export function ReviewHistory() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { reviews, loading, error } = useReviews();

  const openReview = (review: Review) => {
    router.push(`/review?clip=${encodeURIComponent(review.ballId)}&type=${review.type}&from=history`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-6 py-14 text-center">
        <Loader2 className="h-6 w-6 animate-spin text-teal-300" />
        <p className="mt-3 text-sm text-muted-foreground">Loading reviews…</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-rose-500/25 bg-rose-500/[0.03] px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 ring-1 ring-rose-500/25">
            <History className="h-6 w-6 text-rose-300" />
          </span>
          <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
            Could not load reviews
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">{error}</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-foreground/15 bg-foreground/[0.02] px-6 py-14 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/10 ring-1 ring-teal-500/25">
            <History className="h-6 w-6 text-teal-300" />
          </span>
          <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
            No reviews yet
          </h3>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Upload a delivery clip or record one live, then decide it in the workstation — it will
            appear here with the full history.
          </p>
          <button
            type="button"
            onClick={() => router.push('/review')}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-6 text-sm font-semibold text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40"
          >
            <Play className="h-4 w-4" />
            START A REVIEW
          </button>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {reviews.map((review, index) => {
            const status = statusLabel(review.status);
            const out = review.decision === 'OUT';
            return (
              <motion.button
                key={review.id}
                type="button"
                onClick={() => openReview(review)}
                initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.4) }}
                className="group relative flex w-full flex-col gap-3 overflow-hidden rounded-2xl border border-foreground/10 bg-[#0b0b14]/90 px-5 py-4 text-left shadow-xl shadow-black/30 transition-all hover:border-teal-500/30 hover:bg-[#0b0b14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/40 sm:flex-row sm:items-center"
              >
                <span
                  aria-hidden="true"
                  className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/50 to-transparent"
                />

                {/* Match + delivery */}
                <span className="flex min-w-0 flex-1 items-center gap-3">
                  <span
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-mono text-xs font-bold ring-1',
                      out
                        ? 'bg-rose-500/10 text-rose-300 ring-rose-500/25'
                        : 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/25',
                    )}
                  >
                    {review.ballId}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {review.matchLabel}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {new Date(review.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {review.userName && (
                        <span className="text-muted-foreground">· {review.userName}</span>
                      )}
                      {review.userEmail && (
                        <span className="hidden text-muted-foreground sm:inline">
                          · {review.userEmail}
                        </span>
                      )}
                    </span>
                  </span>
                </span>

                {/* Type */}
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-foreground/10 bg-foreground/[0.03] px-3 py-1 text-xs font-medium text-foreground">
                  <ScanLine className="h-3 w-3 text-teal-400" />
                  {TYPE_LABEL[review.type] ?? review.type}
                </span>

                {/* Original → Final */}
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest',
                      decisionStyle(review.onField),
                    )}
                  >
                    {review.onField}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                  <span
                    className={cn(
                      'rounded-full border px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest',
                      decisionStyle(review.decision),
                    )}
                  >
                    {review.decision}
                  </span>
                </span>

                {/* Status */}
                <span
                  className={cn(
                    'inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ring-1',
                    status.classes,
                  )}
                >
                  {status.label}
                </span>

                <ArrowRight className="hidden h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-teal-400 sm:block" />
              </motion.button>
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}