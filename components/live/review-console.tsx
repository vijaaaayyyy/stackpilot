'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Camera,
  Check,
  ChevronRight,
  Film,
  Loader2,
  ShieldAlert,
  Square,
  UploadCloud,
} from 'lucide-react';
import { ClipRecorder, uploadClip } from '@/lib/drs/clips';
import { saveDraftReview } from '@/lib/drs/store';
import { isRolling, rollingRecorder, stopRollingRecorder } from '@/lib/drs/rolling-cam';
import { cn } from '@/lib/utils';

const REVIEW_TYPES = [
  { id: 'lbw', label: 'LBW' },
  { id: 'caught', label: 'Caught' },
  { id: 'runout', label: 'Run Out' },
  { id: 'stumping', label: 'Stumping' },
  { id: 'boundary', label: 'Boundary' },
] as const;

function fmt(seconds: number): string {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

type UploadState =
  | { status: 'idle'; message?: never }
  | { status: 'uploading'; message?: never }
  | { status: 'done'; message: string }
  | { status: 'error'; message: string };

function newClipId(): string {
  return `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ReviewConsole() {
  const router = useRouter();
  const [type, setType] = useState<string>('lbw');

  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState<string | null>(null);
  const [camSeconds, setCamSeconds] = useState(0);
  const [camStream, setCamStream] = useState<MediaStream | null>(null);
  const [upload, setUpload] = useState<UploadState>({ status: 'idle' });
  const [recordedClips, setRecordedClips] = useState<string[]>([]);
  const camRecorderRef = useRef<ClipRecorder | null>(null);
  const camPreviewRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (camStream && camPreviewRef.current) camPreviewRef.current.srcObject = camStream;
  }, [camStream]);

  /* The shared recorder survives navigation to the review player — on return
     (or a straight refresh while recording) just re-attach to it instead of
     losing the rolling buffer. */
  useEffect(() => {
    const rec = rollingRecorder();
    if (!rec.recording) return;
    rec.onTick = setCamSeconds;
    rec.onError = setCamErr;
    camRecorderRef.current = rec;
    setCamOn(true);
    setCamStream(rec.stream);
    setCamSeconds(rec.seconds);
  }, []);

  const toggleCam = useCallback(async () => {
    if (camRecorderRef.current?.recording || isRolling()) {
      await stopRollingRecorder();
      camRecorderRef.current = null;
      setCamOn(false);
      setCamStream(null);
      setCamSeconds(0);
      setUpload({ status: 'idle' });
      return;
    }
    setCamErr(null);
    setUpload({ status: 'idle' });
    const rec = rollingRecorder();
    rec.onTick = setCamSeconds;
    rec.onError = setCamErr;
    camRecorderRef.current = rec;
    await rec.start();
    setCamOn(rec.recording);
    setCamStream(rec.stream);
  }, []);

  /* Cut the last ~15s of the rolling buffer, upload it as a standalone clip,
     write the draft review row, then route to the review player. The buffer
     keeps rolling so the next delivery is captured too. */
  const requestReview = useCallback(async () => {
    const camNow = camRecorderRef.current;
    if (!camNow?.recording) {
      setUpload({ status: 'error', message: 'Press RECORD before the delivery so the ball is captured.' });
      return;
    }
    setUpload({ status: 'uploading' });
    const clipId = newClipId();
    try {
      const blob = camNow.snapshot(15);
      if (!blob) throw new Error('Buffer is still warming up — give it a moment, then try again.');
      const { clip, ok } = await uploadClip(blob, clipId, {
        durationMs: Math.round(camNow.seconds * 1000),
      });
      if (ok) {
        await saveDraftReview({
          matchId: 'standalone',
          matchLabel: 'Standalone review',
          ballId: clipId,
          clipPath: clip.path,
        });
      }
      setRecordedClips((items) => (items.includes(clipId) ? items : [...items, clipId]));
      setUpload({
        status: 'done',
        message: ok
          ? 'Clip saved to the drs-clips bucket.'
          : 'Clip saved on this device.',
      });
      router.push(`/review?clip=${encodeURIComponent(clipId)}&type=${type}&from=live`);
    } catch (error) {
      setUpload({ status: 'error', message: error instanceof Error ? error.message : 'Upload failed.' });
    }
  }, [camRecorderRef, type, router]);

  return (
    <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      {/* Camera / capture card */}
      <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-[#0b0b14]/90 shadow-xl shadow-black/30">
        <span
          aria-hidden="true"
          className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-rose-500/60 to-transparent"
        />

        {/* Header */}
        <div className="relative flex flex-wrap items-center justify-between gap-2 overflow-hidden rounded-t-2xl border-b border-foreground/10 bg-black/40 px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500" />
            </span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-rose-300">
              Live · Umpire Camera
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
            <span className="rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1">
              CAM 01
            </span>
            <span className="rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1">
              {camOn ? `${fmt(camSeconds)} · Rolling 15s` : 'Standby'}
            </span>
          </div>
        </div>

        {/* Preview */}
        <div className="relative aspect-video w-full bg-black">
          {camOn && camStream ? (
            <video
              ref={camPreviewRef}
              autoPlay
              muted
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#06080f] px-6 text-center">
              {/* Framing guides so the pitch runs straight down the middle */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-6 hidden sm:block"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(34,211,238,0.35) 0, rgba(34,211,238,0.35) 1px, transparent 1px, transparent 100%), linear-gradient(to bottom, rgba(34,211,238,0.35) 0, rgba(34,211,238,0.35) 1px, transparent 1px, transparent 100%)',
                  backgroundSize: '100% 40%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/5 ring-1 ring-foreground/10">
                <Camera className="h-6 w-6 text-muted-foreground/60" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">Camera is on standby</p>
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                  Position your phone at the umpire end with the pitch running down the centre of frame,
                  then press RECORD. The last 15 seconds are always kept in a rolling buffer.
                </p>
              </div>
            </div>
          )}

          {/* On-air overlay */}
          {camOn && camStream && (
            <>
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-4 hidden sm:block"
                style={{
                  backgroundImage:
                    'linear-gradient(to right, rgba(251,191,36,0.22) 0, rgba(251,191,36,0.22) 1px, transparent 1px, transparent 100%), linear-gradient(to bottom, rgba(251,191,36,0.22) 0, rgba(251,191,36,0.22) 1px, transparent 1px, transparent 100%)',
                  backgroundSize: '100% 40%',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              />
              <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-lg bg-black/70 px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-rose-300 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-500" />
                Umpire cam · rolling
              </div>
              {(upload.status === 'uploading' || upload.status === 'done') && (
                <div className="pointer-events-none absolute right-3 top-3 rounded-lg bg-black/70 px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-teal-300 backdrop-blur-sm">
                  {upload.status === 'uploading' ? 'Uploading…' : 'Recorded'}
                </div>
              )}
            </>
          )}

          {camErr && (
            <div className="absolute inset-x-0 bottom-0 bg-rose-500/15 px-4 py-2 text-center text-xs text-rose-300 backdrop-blur-sm">
              {camErr}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleCam}
              disabled={Boolean(camErr) && !camOn}
              className={cn(
                'inline-flex h-11 items-center gap-2.5 rounded-xl px-5 text-sm font-semibold transition-colors disabled:opacity-40',
                camOn
                  ? 'bg-rose-500/15 text-rose-300 ring-1 ring-rose-500/40 hover:bg-rose-500/25'
                  : 'bg-teal-500 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600',
              )}
            >
              {camOn ? (
                <>
                  <Square className="h-4 w-4 fill-current" /> STOP
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" /> RECORD
                </>
              )}
            </button>
            <span className="hidden font-mono text-[10px] uppercase tracking-widest text-muted-foreground sm:block">
              {camOn ? 'Rolling buffer active · nothing is lost' : 'Recording keeps the last ball for review'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-wrap items-center gap-1 rounded-xl border border-foreground/10 bg-foreground/[0.02] p-1">
              {REVIEW_TYPES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setType(item.id)}
                  aria-pressed={type === item.id}
                  className={cn(
                    'rounded-lg px-3 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest transition-colors',
                    type === item.id
                      ? 'bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/40'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={requestReview}
              disabled={upload.status === 'uploading' || camErr !== null}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-amber-400 px-5 text-sm font-bold text-black shadow-lg shadow-amber-400/25 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {upload.status === 'uploading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}
              Request Review
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {upload.status !== 'idle' && (
          <div
            className={cn(
              'mx-5 mb-4 flex items-center gap-2 rounded-xl border px-4 py-2.5 text-xs',
              upload.status === 'done'
                ? 'border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-300'
                : upload.status === 'error'
                  ? 'border-rose-500/30 bg-rose-500/[0.06] text-rose-300'
                  : 'border-teal-500/30 bg-teal-500/[0.06] text-teal-300',
            )}
          >
            {upload.status === 'done' ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : upload.status === 'error' ? (
              <ShieldAlert className="h-4 w-4 shrink-0" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {upload.message}
          </div>
        )}
      </div>

      {/* Side rail */}
      <aside className="space-y-4">
        <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-[#0b0b14]/90 shadow-xl shadow-black/30">
          <div className="flex items-center justify-between border-b border-foreground/10 px-5 py-3.5">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Session</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-foreground">Standalone reviews</p>
            </div>
            <span className="rounded-full border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-teal-300">
              {recordedClips.length} sent
            </span>
          </div>

          <div className="space-y-3 p-5">
            <div>
              <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <Film className="h-3.5 w-3.5" /> Record one clip at a time
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Keep the camera rolling. Each <span className="font-mono">Request Review</span> sends the
                last 15 seconds to the review player as its own standalone clip.
              </p>
            </div>

            <div>
              <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                <UploadCloud className="h-3.5 w-3.5" /> Sent to review
              </p>
              {recordedClips.length === 0 ? (
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  No clips sent yet — press RECORD, then Request Review after the delivery.
                </p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {recordedClips.map((clipId) => (
                    <span
                      key={clipId}
                      className="rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-1 font-mono text-[10px] font-semibold text-teal-300"
                    >
                      {clipId}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-foreground/10 bg-[#0b0b14]/70 px-5 py-4 text-[11px] leading-relaxed text-muted-foreground">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-foreground/70">
            How it works
          </p>
          <ol className="mt-2.5 list-decimal space-y-1.5 pl-4">
            <li>RECORD rolls a 15-second buffer — older footage is always discarded.</li>
            <li>After the delivery, pick the review type and tap Request Review.</li>
            <li>The last 15 seconds become a standalone clip routed to the review player.</li>
            <li>Recorded live, review it, decide — your verdict is saved to the review log.</li>
          </ol>
        </div>
      </aside>
    </div>
  );
}