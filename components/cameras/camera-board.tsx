'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Camera, Settings, Square, Video } from 'lucide-react';
import { toast } from 'sonner';
import { StatusPill } from '@/components/cameras/status-pill';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type CameraFeed = {
  id: number;
  name: string;
  position: string;
  resolution: string;
  signal: 'good' | 'fair' | 'strong';
  recording: boolean;
  primary?: boolean;
};

const INITIAL_CAMERAS: CameraFeed[] = [
  {
    id: 1,
    name: 'CAMERA 01',
    position: 'UMPIRE END',
    resolution: '1080p 60 FPS',
    signal: 'good',
    recording: true,
    primary: true,
  },
  {
    id: 2,
    name: 'CAMERA 02',
    position: 'SQUARE LEG',
    resolution: '1080p 60 FPS',
    signal: 'good',
    recording: true,
  },
  {
    id: 3,
    name: 'CAMERA 03',
    position: 'BEHIND WICKET',
    resolution: '1080p 30 FPS',
    signal: 'fair',
    recording: false,
  },
];

const selectClass =
  'flex h-10 w-full rounded-lg border border-foreground/10 bg-foreground/[0.03] px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30';

function signalTone(signal: CameraFeed['signal']) {
  if (signal === 'good') return 'emerald';
  if (signal === 'strong') return 'teal';
  return 'amber';
}

function CameraSettingsDialog({
  camera,
  open,
  onOpenChange,
}: {
  camera: CameraFeed | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Camera settings</DialogTitle>
          <DialogDescription>
            {camera ? `Configure ${camera.name}` : 'Configure camera'} — changes are simulated for
            the demo.
          </DialogDescription>
        </DialogHeader>

        {camera && (
          <div className="space-y-5">
            <div>
              <Label htmlFor="settings-name" className="mb-1.5 text-xs text-muted-foreground">
                Camera name
              </Label>
              <Input
                id="settings-name"
                defaultValue={camera.name}
                className="border-foreground/10 bg-foreground/[0.03] text-foreground placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="settings-position" className="mb-1.5 text-xs text-muted-foreground">
                  Position
                </Label>
                <select id="settings-position" defaultValue={camera.position} className={selectClass}>
                  <option>UMPIRE END</option>
                  <option>SQUARE LEG</option>
                  <option>BEHIND WICKET</option>
                </select>
              </div>
              <div>
                <Label htmlFor="settings-resolution" className="mb-1.5 text-xs text-muted-foreground">
                  Resolution
                </Label>
                <select
                  id="settings-resolution"
                  defaultValue={camera.resolution}
                  className={selectClass}
                >
                  <option>4K 30 FPS</option>
                  <option>1080p 60 FPS</option>
                  <option>1080p 30 FPS</option>
                  <option>720p 120 FPS</option>
                </select>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => {
                onOpenChange(false);
                toast.success('Settings saved', {
                  description: `${camera.name} will apply the new settings from the next capture.`,
                });
              }}
              className="h-10 w-full rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40"
            >
              Save settings
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function CameraBoard() {
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);
  const [settingsCamera, setSettingsCamera] = useState<CameraFeed | null>(null);

  const toggleRecording = (id: number) => {
    setCameras((current) =>
      current.map((camera) => {
        if (camera.id !== id) return camera;
        const next = !camera.recording;
        toast.info(
          next ? `${camera.name} recording started` : `${camera.name} recording stopped`,
        );
        return { ...camera, recording: next };
      }),
    );
  };

  return (
    <>
      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cameras.map((camera) => {
          const signalToneVariant = signalTone(camera.signal);
          return (
            <div
              key={camera.id}
              className="group relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              />

              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/20 transition-transform duration-300 group-hover:scale-110">
                  <Camera className="h-5 w-5 text-teal-400" />
                </span>
                <StatusPill tone="emerald">Connected</StatusPill>
              </div>

              <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
                {camera.name}
                {camera.primary && (
                  <span className="ml-2 inline-block rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-medium text-teal-400">
                    Primary
                  </span>
                )}
              </h3>

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-semibold text-foreground/80">
                  {camera.position}
                </span>
                <span className="rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-semibold text-foreground/80">
                  {camera.resolution}
                </span>
                <StatusPill tone={signalToneVariant}>Signal {camera.signal}</StatusPill>
                <StatusPill tone={camera.recording ? 'rose' : 'muted'}>
                  Recording {camera.recording ? 'On' : 'Off'}
                </StatusPill>
              </div>

              <div className="relative mt-5 overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.02]">
                <div className="h-24 w-full bg-gradient-to-br from-teal-500/5 via-foreground/[0.02] to-transparent" />
                <span className="absolute inset-0 flex items-center justify-center gap-1.5 text-[10px] font-medium text-muted-foreground">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'h-1.5 w-1.5 rounded-full transition-colors',
                      camera.recording ? 'animate-pulse bg-rose-500' : 'bg-foreground/25',
                    )}
                  />
                  Live preview · {camera.recording ? 'REC' : 'standby'}
                </span>
              </div>

              <div className="mt-5 flex flex-col gap-2">
                <Link
                  href="/cameras/calibrate"
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-teal-500 text-sm font-medium text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40"
                >
                  <Settings className="h-4 w-4" />
                  Calibrate Camera
                </Link>
                <button
                  type="button"
                  onClick={() => toggleRecording(camera.id)}
                  className={cn(
                    'inline-flex h-9 items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors',
                    camera.recording
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/15'
                      : 'border-foreground/10 bg-transparent text-foreground hover:bg-foreground/5',
                  )}
                >
                  {camera.recording ? (
                    <>
                      <Square className="h-3.5 w-3.5" /> Stop Recording
                    </>
                  ) : (
                    <>
                      <Video className="h-3.5 w-3.5" /> Start Recording
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsCamera(camera)}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-foreground/10 bg-transparent text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
                >
                  <Settings className="h-3.5 w-3.5" /> Camera Settings
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <CameraSettingsDialog
        camera={settingsCamera}
        open={settingsCamera !== null}
        onOpenChange={(open) => {
          if (!open) setSettingsCamera(null);
        }}
      />
    </>
  );
}