/**
 * Real audio analysis for the review workstation — decodes the actual clip
 * audio in the browser (WebAudio) and produces the waveform bars plus the
 * loudest-sample marker used by the UltraEdge-style strip. This is derived
 * from the clip itself; nothing is canned.
 */

export type ClipAudio = {
  durationMs: number;
  sampleRate: number;
  /** ~WAVE_BINS bars, each 0..1 (normalized peak of that bin). */
  peaks: number[];
  /** Time (ms within the clip) of the single loudest sample. */
  peakAtMs: number;
  /** Loudness of that sample in dBFS (negative). */
  peakDb: number;
};

const WAVE_BINS = 96;

function createOfflineContext(lengthMs: number): OfflineAudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor =
    window.OfflineAudioContext ??
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
      .webkitOfflineAudioContext;
  if (!Ctor) return null;
  return new Ctor(1, Math.max(1, Math.ceil((lengthMs / 1000) * 48_000)), 48_000);
}

/**
 * Decode a clip URL (blob: or signed) into mono samples and reduce to a
 * normalized waveform + the loudest moment. Returns null when the browser
 * cannot decode the audio (or the clip has no audio track).
 */
export async function analyzeClipAudio(url: string): Promise<ClipAudio | null> {
  if (typeof window === 'undefined' || !url) return null;
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const arrayBuffer = await response.arrayBuffer();
    if (!arrayBuffer.byteLength) return null;

    /* Two-pass: figure out duration first (decode), then compute peaks. The
       OfflineAudioContext length is a hard upper bound; clips are ~15s max. */
    const ctx = createOfflineContext(60_000);
    if (!ctx) return null;
    const decoded = await ctx.decodeAudioData(arrayBuffer);
    if (!decoded || decoded.length === 0) return null;

    const channel = decoded.getChannelData(0);
    const durationMs = decoded.duration * 1000;
    const sampleRate = decoded.sampleRate;

    const binCount = Math.min(WAVE_BINS, Math.max(32, Math.floor(channel.length / 480)));
    const binSize = Math.max(1, Math.floor(channel.length / binCount));

    const peaks: number[] = Array.from({ length: binCount }, (_, bin) => {
      let max = 0;
      const start = bin * binSize;
      const end = Math.min(start + binSize, channel.length);
      for (let i = start; i < end; i += 1) {
        const value = Math.abs(channel[i]);
        if (value > max) max = value;
      }
      return max;
    });

    const globalMax = Math.max(...peaks, 0.0001);
    const normalized = peaks.map((value) => Math.min(1, value / globalMax));

    let peakBin = 0;
    for (let bin = 1; bin < peaks.length; bin += 1) {
      if (peaks[bin] > peaks[peakBin]) peakBin = bin;
    }
    const peakValue = peaks[peakBin] ?? 0;
    const peakAtMs = Math.round(((peakBin + 0.5) * binSize * 1000) / sampleRate);
    const peakDb = Math.max(-90, Math.round(20 * Math.log10(Math.min(1, peakValue)) * 10) / 10);

    return { durationMs, sampleRate, peaks: normalized, peakAtMs, peakDb };
  } catch {
    /* Unsupported codec (e.g. some .mov), or audio absent — caller shows the
       honest "no audio track / couldn't decode" state instead of faking it. */
    return null;
  }
}