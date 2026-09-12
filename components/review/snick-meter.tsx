'use client';

import { cn } from '@/lib/utils';
import type { ClipAudio } from '@/lib/drs/audio';

/**
 * UltraEdge-style audio strip rendered from the REAL decoded clip audio.
 * Bars show the actual loudness envelope; the marker sits on the loudest
 * sample in the clip. Honest — no waveform is faked.
 */
export function SnickMeter({
  audio,
  markerAtMs,
  label = 'CLIP AUDIO',
  className,
}: {
  audio: ClipAudio | null;
  /** Optional marker position override (ms). Falls back to audio.peakAtMs. */
  markerAtMs?: number | null;
  label?: string;
  className?: string;
}) {
  const marker = markerAtMs ?? audio?.peakAtMs ?? null;
  const shown = audio?.peaks ?? [];
  const hasAudio = audio !== null && shown.length > 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-white/10 bg-black/70 backdrop-blur-sm',
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.24em] text-white/50">
          {label}
        </span>
        {hasAudio ? (
          <span className="font-mono text-[9px] font-semibold uppercase tracking-widest text-teal-300">
            {audio.sampleRate >= 1000
              ? `${Math.round(audio.sampleRate / 1000)} kHz`
              : `${audio.sampleRate} Hz`}
            {audio.peakDb != null ? ` · peak ${audio.peakDb >= 0 ? '+' : ''}${audio.peakDb.toFixed(1)} dB` : ''}
          </span>
        ) : (
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">
            no audio track
          </span>
        )}
      </div>

      <div className="relative flex h-11 flex-col justify-center gap-0.5 px-2 py-1.5">
        {hasAudio ? (
          <>
            <div className="flex h-full items-center gap-px">
              {shown.map((level, index) => {
                const i = index;
                const t = i / Math.max(1, shown.length - 1);
                const isAfterMarker = marker !== null && t * audio.durationMs >= marker;
                return (
                  <span
                    key={i}
                    className={cn(
                      'w-full origin-center rounded-[1px]',
                      isAfterMarker ? 'bg-amber-400/80' : 'bg-teal-400/50',
                    )}
                    style={{ height: `${Math.max(6, level * 100)}%` }}
                  />
                );
              })}
            </div>

            {marker !== null && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 top-0 w-px bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.8)]"
                style={{ left: `${Math.min(100, Math.max(0, (marker / Math.max(1, audio.durationMs)) * 100))}%` }}
              />
            )}
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-1">
            <span className="h-6 w-px bg-white/20" />
            <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
              Not decodable — review visually
            </span>
          </div>
        )}
      </div>

      {marker !== null && (
        <div className="flex items-center justify-between px-3 py-1">
          <span className="font-mono text-[9px] uppercase tracking-widest text-white/35">
            {label}: {hasAudio ? `${(marker / 1000).toFixed(2)}s` : 'peak'}
          </span>
          {hasAudio && (
            <span className="font-mono text-[9px] uppercase tracking-widest text-amber-300">
              SPIKE ▸ {audio.peakAtMs === Math.round(marker) || marker === audio.peakAtMs ? 'LOUDEST' : 'MARKER'}
            </span>
          )}
        </div>
      )}
    </div>
  );
}