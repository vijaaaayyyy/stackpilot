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
  deleteClipRow(ballId).catch(() => undefined);
}

/**
 * A MediaRecorder rolling buffer for the match camera: records in ~2s chunks,
 * keeps only the last 8 (~15s) in memory and drops older ones as new chunks
 * arrive, so memory stays flat even if recording runs all match. `snapshot()`
 * stitches the current buffer into one Blob without stopping — review / upload
 * takes the current window and recording keeps rolling for the next delivery.
 */
export class ClipRecorder {
  private static readonly TIMESLICE_MS = 2000;
  private static readonly MAX_BUFFER_CHUNKS = 8;

  private mediaStream: MediaStream | null = null;
  private recorder: MediaRecorder | null = null;
  private chunks: { time: number; data: Blob }[] = [];
  private startedAt = 0;
  private timer: number | null = null;
  private elapsed = 0;
  private doneResolve: ((blob: Blob | null) => void) | null = null;

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
      if (event.data.size > 0) {
        this.chunks.push({ time: Date.now(), data: event.data });
        /* Rolling buffer — discard chunks older than the window we care about */
        while (this.chunks.length > ClipRecorder.MAX_BUFFER_CHUNKS) {
          this.chunks.shift();
        }
      }
    };
    this.recorder.onstop = () => {
      const blob = this.snapshot();
      if (blob) this.onDone?.(blob);
      this.doneResolve?.(blob ?? null);
      this.doneResolve = null;
      this.recorder = null;
    };
    this.recorder.start(ClipRecorder.TIMESLICE_MS);
    this.startedAt = Date.now();
    this.elapsed = 0;
    if (this.timer) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      this.elapsed = (Date.now() - this.startedAt) / 1000;
      this.onTick?.(this.elapsed);
    }, 250);
  }

  /**
   * Stitch the in-memory rolling buffer into a single Blob WITHOUT stopping
   * the recorder — recording keeps rolling for the next delivery. Optional
   * `keepLastSeconds` trims to just that trailing window.
   */
  snapshot(keepLastSeconds = 0): Blob | null {
    if (this.chunks.length === 0) return null;
    let kept = this.chunks;
    if (keepLastSeconds > 0) {
      const windowStart = Date.now() - keepLastSeconds * 1000;
      const within = this.chunks.filter((chunk) => chunk.time >= windowStart);
      if (within.length > 0) kept = within;
    }
    const blob = new Blob(
      kept.map((chunk) => chunk.data),
      { type: this.recorder?.mimeType || 'video/webm' },
    );
    return blob.size > 0 ? blob : null;
  }

  /**
   * Stop capturing and resolve with the buffered footage. `keepLastSeconds`
   * trims the rolling buffer to just the trailing window (the final delivery).
   */
  async stop(stopTracks = true, keepLastSeconds = 0): Promise<Blob | null> {
    if (this.timer) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.elapsed = (Date.now() - this.startedAt) / 1000;
    let done: Promise<Blob | null> = Promise.resolve(this.snapshot(keepLastSeconds));
    if (this.recorder?.state === 'recording') {
      done = new Promise<Blob | null>((resolve) => {
        this.doneResolve = resolve;
      });
      this.recorder.stop();
    } else {
      this.recorder = null;
    }
    if (stopTracks && this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    return done;
  }

  destroy(): Promise<void> {
    return this.stop(true).then(() => undefined);
  }
}

export type ClipUploadResult = { clip: ReviewClip; ok: boolean };

/**
 * Upload a captured blob to Supabase Storage (`drs-clips` private bucket,
 * `{match_id}/{ball_id}.webm`) and refresh the local index. The returned clip
 * carries a time-limited signed URL for playback; callers should re-resolve
 * via `resolveClipUrl` once it expires.
 */
export async function uploadClip(
  blob: Blob,
  ballId: string,
  metadata?: { matchId?: string; durationMs?: number },
): Promise<ClipUploadResult> {
  const owner = await currentUserId();
  const folder = metadata?.matchId || owner;
  const path = `${folder}/${ballId}.webm`;
  let url = '';
  let ok = false;
  if (isSupabaseConfigured) {
    try {
      const client = createClient();
      const { data, error } = await client.storage
        .from(CLIPS_BUCKET)
        .upload(path, blob, { contentType: blob.type || 'video/webm', upsert: true });
      if (error) throw error;
      const signed = await client.storage.from(CLIPS_BUCKET).createSignedUrl(data.path, 3600);
      if (signed.error) throw signed.error;
      url = signed.data?.signedUrl ?? '';
      ok = Boolean(url);
    } catch {
      url = '';
      ok = false;
    }
  }
  if (!url && typeof window !== 'undefined') {
    url = URL.createObjectURL(blob);
  }
  const clip: ReviewClip = {
    ballId,
    name: `${ballId}.webm`,
    size: blob.size,
    mime: blob.type || 'video/webm',
    durationMs: metadata?.durationMs ?? 0,
    capturedAt: Date.now(),
    path,
    url,
  };
  cacheClip(clip);
  await saveClipRow(clip);
  return { clip, ok };
}

/** Fresh, playable URL for a clip — existing signed/object URL, else re-sign. */
export async function resolveClipUrl(clip: ReviewClip): Promise<string> {
  if (clip.url && !clip.url.startsWith('blob:') && clip.url.includes('drs-clips')) {
    return clip.url;
  }
  if (isSupabaseConfigured && clip.path) {
    try {
      const client = createClient();
      const signed = await client.storage.from(CLIPS_BUCKET).createSignedUrl(clip.path, 3600);
      if (!signed.error && signed.data?.signedUrl) return signed.data.signedUrl;
    } catch {
      /* keep the cached url as a fallback */
    }
  }
  return clip.url || '';
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

/** Persist the clip row into the Postgres journal (upsert by ball_id). */
async function saveClipRow(clip: ReviewClip): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const client = createClient();
    await client.from('drs_clips').upsert(
      {
        ball_id: clip.ballId,
        owner: (await currentUserId()) ?? 'anon',
        path: clip.path,
        name: clip.name,
        size: clip.size,
        mime: clip.mime,
        duration_ms: clip.durationMs,
        url: clip.url,
        captured_at: new Date(clip.capturedAt).toISOString(),
      },
      { onConflict: 'ball_id' },
    );
  } catch {
    /* remote unavailable — the localStorage index still covers this device */
  }
}

/** Remove the clip row from the Postgres journal for `ballId`. */
async function deleteClipRow(ballId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const client = createClient();
    await client.from('drs_clips').delete().eq('ball_id', ballId);
  } catch {
    /* remote unavailable */
  }
}