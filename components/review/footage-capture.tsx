'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, RotateCcw, Trash2, Upload, Video, Loader2, Check } from 'lucide-react';
import { ClipRecorder, uploadClip, type ReviewClip } from '@/lib/drs/clips';
import { cn } from '@/lib/utils';

function fmt(seconds: number): string {
  const s = Math.floor(seconds);
  const m = Math.floor(s / 60);
  const r = String(s % 60).padStart(2, '0');
  return `${m}:${r}`;
}

export function FootageCapture({
  ballId,
  matchId,
  initial,
  onClip,
}: {
  ballId: string;
  matchId?: string;
  initial: ReviewClip | null;
  onClip: (clip: ReviewClip, ok: boolean) => void;
}) {
  const [clip, setClip] = useState<ReviewClip | null>(initial);
  const [recorder, setRecorder] = useState<ClipRecorder | null>(null);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [pending, setPending] = useState<Blob | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (stream && previewRef.current) previewRef.current.srcObject = stream;
  }, [stream]);

  useEffect(
    () => () => {
      recorder?.destroy().catch(() => undefined);
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    },
    [recorder, pendingUrl],
  );

  const startRecording = async () => {
    setError(null);
    setSaved(false);
    const rec = new ClipRecorder();
    rec.onTick = setSeconds;
    rec.onError = (message) => setError(message);
    rec.onDone = (blob) => {
      setStream(null);
      setRecording(false);
      setPending(blob);
      if (pendingUrl) URL.revokeObjectURL(pendingUrl);
      setPendingUrl(URL.createObjectURL(blob));
    };
    setRecorder(rec);
    await rec.start();
    setRecording(rec.recording);
    setStream(rec.stream);
  };

  const stopRecording = async () => {
    await recorder?.stop();
  };

  const discard = () => {
    setPending(null);
    if (pendingUrl) URL.revokeObjectURL(pendingUrl);
    setPendingUrl(null);
  };

  const saveCapture = async () => {
    if (!pending) return;
    setUploading(true);
    setError(null);
    const durationMs = Math.round(seconds * 1000);
    const { clip: newClip, ok } = await uploadClip(pending, ballId, { matchId, durationMs });
    setClip(newClip);
    setUploading(false);
    setSaved(true);
    discard();
    onClip(newClip, ok);
  };

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setError(null);
    setSaved(false);
    setUploading(true);
    const durationMs = 0;
    const { clip: newClip, ok } = await uploadClip(file, ballId, { matchId, durationMs });
    setClip(newClip);
    setUploading(false);
    setSaved(true);
    onClip(newClip, ok);
  };

  return (
    <div className="rounded-lg border border-white/10 bg-[#0a1610] p-3">
      <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/50">
        <Video className="h-3.5 w-3.5" />
        Ph-Phone footage
      </div>

      {error && <p className="mb-2 text-xs text-rose-300">{error}</p>}

      {(recording || pendingUrl) && (
        <div className="relative mb-3 aspect-video w-full overflow-hidden rounded-md border border-white/10 bg-black">
          <video
            ref={previewRef}
            src={pendingUrl ?? undefined}
            autoPlay
            muted
            playsInline
            className="h-full w-full object-cover"
          />
          {recording && (
            <div className="absolute left-2 top-2 flex items-center gap-1.5 rounded bg-black/70 px-2 py-1 font-mono text-[10px] text-rose-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
              REC {fmt(seconds)}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {recording ? (
          <button
            type="button"
            onClick={stopRecording}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-rose-500/15 px-3 text-xs font-semibold text-rose-300 ring-1 ring-rose-500/40 hover:bg-rose-500/25"
          >
            <span className="h-2 w-2 rounded-sm bg-rose-400" />
            STOP
          </button>
        ) : (
          <button
            type="button"
            onClick={startRecording}
            disabled={Boolean(pending)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-teal-500/10 px-3 text-xs font-semibold text-teal-300 ring-1 ring-teal-400/30 hover:bg-teal-500/20 disabled:opacity-40"
          >
            <Camera className="h-3.5 w-3.5" />
            {pending ? 'RECORDING CAPTURED' : 'RECORD LAST BALL'}
          </button>
        )}

        {pending ? (
          <>
            <button
              type="button"
              onClick={saveCapture}
              disabled={uploading}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/25 disabled:opacity-60"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              USE THIS CLIP
            </button>
            <button
              type="button"
              onClick={discard}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-white/60 hover:text-white"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              RE-TAKE
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-medium text-white/60 hover:text-white disabled:opacity-40"
            >
              <Upload className="h-3.5 w-3.5" />
              UPLOAD CLIP
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(event) => onPickFile(event.target.files?.[0] ?? null)}
            />
          </>
        )}
      </div>

      {clip && (
        <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2">
          <span className={cn('font-mono text-[10px] uppercase tracking-wider', saved ? 'text-emerald-300' : 'text-white/40')}>
            {saved ? 'Clip saved to review' : clip.name}
          </span>
          <button
            type="button"
            onClick={() => {
              setClip(null);
              detachClip();
            }}
            className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-white/40 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" />
            Detach
          </button>
        </div>
      )}
    </div>
  );
}

function detachClip(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('turf-drs:clip-detached'));
}