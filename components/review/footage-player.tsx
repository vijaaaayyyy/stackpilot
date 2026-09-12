'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, StepBack, StepForward } from 'lucide-react';

const FRAME_MS = 1000 / 30;

function fmt(seconds: number): string {
  const total = Math.max(0, Math.round(seconds * 1000));
  const ms = String(total % 1000).padStart(3, '0');
  const s = Math.floor(total / 1000) % 60;
  const m = Math.floor(total / 60000);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${ms}`;
}

const SPEEDS = [0.25, 0.5, 1] as const;

export function FootagePlayer({
  src,
  title = 'Delivery footage',
}: {
  src: string;
  title?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState<number>(1);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  }, [speed]);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
    } else {
      video.pause();
    }
  };

  const step = (deltaMs: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = Math.min(
      Math.max(0, video.currentTime + deltaMs / 1000),
      video.duration || 0,
    );
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0a1610]">
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          src={src}
          className="h-full w-full"
          preload="auto"
          onClick={toggle}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onTimeUpdate={(event) => setTime(event.currentTarget.currentTime)}
          onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        />
        <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white/70">
          {title}
        </div>
        <div className="pointer-events-none absolute right-2 top-2 rounded bg-black/70 px-2 py-0.5 font-mono text-[10px] tracking-wider text-teal-300">
          {fmt(time)}
        </div>
      </div>

      <div className="flex items-center gap-2 px-3 py-2">
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={FRAME_MS / 1000}
          value={Math.min(time, duration || 0)}
          onChange={(event) => {
            const video = videoRef.current;
            if (video) video.currentTime = Number(event.target.value);
          }}
          className="h-1 flex-1 cursor-pointer accent-teal-400"
          aria-label="Scrub footage"
        />
        <span className="w-24 text-right font-mono text-[10px] text-white/40">{fmt(duration)}</span>
      </div>

      <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => step(-FRAME_MS)}
            className="rounded-md border border-white/10 p-1.5 text-white/60 hover:text-white"
            title="Previous frame"
            aria-label="Previous frame"
          >
            <StepBack className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={toggle}
            className="rounded-md bg-teal-500/15 p-1.5 text-teal-300 ring-1 ring-teal-400/30 hover:bg-teal-500/25"
            title={playing ? 'Pause' : 'Play'}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => step(FRAME_MS)}
            className="rounded-md border border-white/10 p-1.5 text-white/60 hover:text-white"
            title="Next frame"
            aria-label="Next frame"
          >
            <StepForward className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setSpeed(s)}
              className={
                s === speed
                  ? 'rounded bg-teal-500/20 px-1.5 py-0.5 font-mono text-[10px] text-teal-300'
                  : 'rounded px-1.5 py-0.5 font-mono text-[10px] text-white/50 hover:text-white'
              }
            >
              {s}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}