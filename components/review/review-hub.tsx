'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Award,
  Camera,
  ChevronRight,
  History,
  Loader2,
  Radio,
  ScanLine,
  Sparkles,
  Upload,
  Video,
} from 'lucide-react';
import { uploadVideoFile } from '@/lib/drs/clips';
import { useReviews } from '@/lib/drs/store';
import type { ReviewTypeId } from '@/lib/drs/types';
import { cn } from '@/lib/utils';

const TYPE_LABEL: Record<string, string> = {
  lbw: 'LBW',
  caught: 'Caught',
  runout: 'Run Out',
  stumping: 'Stumping',
  boundary: 'Boundary',
};

const DECISION_TONE: Record<string, string> = {
  OUT: 'text-rose-300',
  'NOT OUT': 'text-emerald-300',
  INCONCLUSIVE: 'text-amber-300',
};

function timeAgo(ts: number): string {
  const delta = Math.max(0, Date.now() - ts);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function ReviewHub() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { reviews, loading } = useReviews();

  const pickFile = () => fileRef.current?.click();

  const startUpload = async (file: File) => {
    if (!file || uploading) return;
    setUploading(true);
    try {
      const clip = await uploadVideoFile(file, file.name);
      router.push(`/review?clip=${encodeURIComponent(clip.ballId)}&from=upload`);
    } catch {
      setUploading(false);
    }
  };

  const recent = reviews.slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Start a review */}
      <section className="mt-10 grid gap-4 sm:grid-cols-2">
        {/* Upload video */}
        <input
          ref={fileRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void startUpload(file);
            event.target.value = '';
          }}
        />
        <button
          type="button"
          onClick={pickFile}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            const file = event.dataTransfer.files?.[0];
            if (file) void startUpload(file);
          }}
          className={cn(
            'group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left transition-all hover:border-amber-400/40 hover:bg-white/[0.05]',
            dragActive && 'border-amber-400/60 bg-amber-400/[0.06]',
          )}
        >
          <div className="flex items-start justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-400/15 ring-1 ring-amber-400/30">
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin text-amber-300" />
              ) : (
                <Upload className="h-5 w-5 text-amber-300" />
              )}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
              {uploading ? 'uploading…' : 'standalone clip'}
            </span>
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
            {uploading ? 'Uploading video…' : 'Review an uploaded video'}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-white/50">
            Pick any delivery clip from your phone. The AI analyzes it, you pick the review type, then you give the verdict.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
            Browse files <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </button>

        {/* Record live */}
        <Link
          href="/live"
          className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left transition-all hover:border-teal-400/40 hover:bg-white/[0.05]"
        >
          <div className="flex items-start justify-between">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/15 ring-1 ring-teal-400/30">
              <Camera className="h-5 w-5 text-teal-300" />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/30">
              record live
            </span>
          </div>
          <h3 className="mt-4 text-lg font-semibold tracking-tight text-foreground">
            Record live from the camera
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-white/50">
            Roll a rolling 15-second buffer on the match camera, then request a review on the spot.
          </p>
          <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-teal-300">
            <Radio className="h-3.5 w-3.5" />
            Open live console <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </section>

      {/* How it works */}
      <section className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { icon: ScanLine, step: '1', text: 'Upload or record the delivery clip' },
          { icon: Sparkles, step: '2', text: 'AI lines up the frame-by-frame evidence for your review type' },
          { icon: Award, step: '3', text: 'You rule OUT / NOT OUT — saved to the review log' },
        ].map(({ icon: Icon, step, text }) => (
          <div
            key={step}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] font-mono text-xs font-semibold text-amber-300">
              <Icon className="h-4 w-4" />
            </span>
            <p className="text-[13px] leading-snug text-white/60">{text}</p>
          </div>
        ))}
      </section>

      {/* Recent reviews */}
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-white/45">
            <History className="h-3.5 w-3.5" />
            Recent reviews
          </h2>
          <Link
            href="/reviews"
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-300 transition-colors hover:text-amber-200"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-3 space-y-2">
          {loading && (
            <div className="space-y-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/[0.03]" />
              ))}
            </div>
          )}
          {!loading && recent.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-5 py-8 text-center">
              <Video className="mx-auto h-6 w-6 text-white/25" />
              <p className="mt-2 text-sm text-white/45">
                No reviews yet — upload a clip or start a live review above.
              </p>
            </div>
          )}
          {recent.map((review) => (
            <Link
              key={review.id}
              href="/reviews"
              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/[0.06]">
                  <Video className="h-4 w-4 text-white/40" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {review.type ? (TYPE_LABEL[review.type] ?? review.type) : 'Review'} review{' '}
                    <span className="text-white/35">·</span>{' '}
                    <span className="text-white/45">{timeAgo(review.createdAt)}</span>
                  </p>
                  <p className="truncate text-xs text-white/40">
                    {review.ballId} · {review.matchLabel}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 font-mono text-[11px] font-bold uppercase tracking-widest',
                  DECISION_TONE[review.decision] ?? 'text-white/50',
                )}
              >
                {review.decision}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}