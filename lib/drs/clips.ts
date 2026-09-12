'use client';

import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';

/**
 * Delivery-footage clips: captured on the user's phone (or uploaded from a
 * saved recording), kept in a small localStorage index for instant access,
 * and uploaded to a Supabase Storage bucket so they survive the device.
 */

export const CLIPS_BUCKET = 'drs-clips';
export const CLIPS_INDEX_KEY = 'turf-drs:clips';

export type ReviewClip = {
  ballId: string;
  name: string;
  size: number;
  mime: string;
  durationMs: number;
  capturedAt: number;
  /** Storage path inside CLIPS_BUCKET, e.g. {userId}/{ballId}.webm */
  path: string;
  /** Public URL (works once the bucket is public / signed URL configured). */
  url: string;
};

function readIndex(): Record<string, ReviewClip> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CLIPS_INDEX_KEY);
    return raw ? (JSON.parse(raw) as Record<string, ReviewClip>) : {};
  } catch {
    return {};
  }
}

function writeIndex(index: Record<string, ReviewClip>): void {
  try {
    window.localStorage.setItem(CLIPS_INDEX_KEY, JSON.stringify(index));
  } catch {
    /* storage unavailable */
  }
}

export function getClip(ballId: string): ReviewClip | null {
  return readIndex()[ballId] ?? null;
}

export function cacheClip(clip: ReviewClip): void {
  const index = readIndex();
  index[clip.ballId] = clip;
  writeIndex(index);
  window.dispatchEvent(new CustomEvent('turf-drs:clips-changed'));
}

export function deleteClip(ballId: string): void {
  const index = readIndex();
  delete index[ballId];
  writeIndex(index);
  window.dispatchEvent(new CustomEvent('turf-drs:clips-changed'));
}

/** A tiny MediaRecorder wrapper that captures from the rear camera. */
export class ClipRecorder {
  private mediaStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startedAt = 0;
  private timer: number | null = null;
  private elapsed = 0;

  onTick: ((seconds: number) => void) | null = null;
  onDone: ((blob: Blob) => void) | null = null;
  onError: ((message: string) => void) | null = null;

  get recording(): boolean {
    return this.recorder?.state === 'recording';
  }

  get seconds(): number {
    return this.elapsed;
  }

  /** Live camera feed, available while recording (for preview). */
  get stream(): MediaStream | null {
    return this.mediaStream;
  }

  async start(): Promise<void> {
    if (this.recorder?.state === 'recording') return;
    await this.stop(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.onError?.('Live recording is not supported in this browser.');
      return;
    }
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
    } catch {
      this.onError?.('Camera permission denied. Use "Upload clip" instead.');
      return;
    }
    const mime = MediaRecorder.isTypeSupported('video/mp4')
      ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : 'video/webm';
    const stream = this.mediaStream;
    this.recorder = new MediaRecorder(stream, {
      mimeType: mime,
      videoBitsPerSecond: 2_500_000,
    });
    this.chunks = [];
    this.recorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.chunks.push(event.data);
    };
    this.recorder.onstop = () => {
      const blob = new Blob(this.chunks, { type: this.recorder?.mimeType || mime });
      if (blob.size > 0) this.onDone?.(blob);
      this.stop(false).catch(() => undefined);
    };
    this.recorder.start(250);
    this.startedAt = Date.now();
    if (this.timer) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      this.elapsed = (Date.now() - this.startedAt) / 1000;
      this.onTick?.(this.elapsed);
    }, 250);
  }

  async stop(stopTracks = true): Promise<void> {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.elapsed = (Date.now() - this.startedAt) / 1000;
    if (this.recorder?.state === 'recording') {
      this.recorder.stop();
    }
    if (stopTracks && this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
  }

  destroy(): Promise<void> {
    return this.stop(true);
  }
}

export type ClipUploadResult = { clip: ReviewClip; ok: boolean };

/** Upload a captured blob to Supabase Storage and refresh the local index. */
export async function uploadClip(
  blob: Blob,
  ballId: string,
  metadata?: { durationMs?: number },
): Promise<ClipUploadResult> {
  const owner = await currentUserId();
  const path = `${owner}/${ballId}-${Date.now()}.webm`;
  let url = '';
  if (isSupabaseConfigured) {
    try {
      const client = createClient();
      const { data, error } = await client.storage
        .from(CLIPS_BUCKET)
        .upload(path, blob, { contentType: blob.type || 'video/webm', upsert: true });
      if (error) throw error;
      url = client.storage.from(CLIPS_BUCKET).getPublicUrl(data.path).data.publicUrl;
    } catch {
      url = '';
    }
  }
  if (!url && typeof window !== 'undefined') {
    url = URL.createObjectURL(blob);
  }
  const clip: ReviewClip = {
    ballId,
    name: `delivery-${ballId}.webm`,
    size: blob.size,
    mime: blob.type || 'video/webm',
    durationMs: metadata?.durationMs ?? 0,
    capturedAt: Date.now(),
    path,
    url,
  };
  cacheClip(clip);
  return { clip, ok: isSupabaseConfigured && Boolean(url) };
}

async function currentUserId(): Promise<string> {
  if (!isSupabaseConfigured || typeof window === 'undefined') return 'anon';
  try {
    const client = createClient();
    const { data } = await client.auth.getUser();
    return data.user?.id ?? 'anon';
  } catch {
    return 'anon';
  }
}