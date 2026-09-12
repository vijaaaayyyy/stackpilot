import type { Metadata } from 'next';
import { Camera, Check, Video } from 'lucide-react';
import { TurfShell, TurfPageHeader } from '@/components/turf/turf-shell';

export const metadata: Metadata = {
  title: 'Cameras',
  description: 'Set up your camera at the umpire end for Turf DRS auto-capture.',
  alternates: { canonical: '/cameras' },
};

const positions = [
  {
    icon: Camera,
    title: 'Umpire end',
    primary: true,
    body: 'The main camera. Place it at the umpire end with a wide, level view of the full pitch and stumps at both ends.',
    tips: ['Use a tripod or stable mount', 'Keep the lens at roughly stump height', 'Frame both sets of stumps in the shot'],
  },
  {
    icon: Video,
    title: 'Square-leg (optional)',
    primary: false,
    body: 'A second angle on the side can help verify height and impact for LBW reviews.',
    tips: ['Aim across the pitch', 'Wide enough to cover the batter and stumps', 'Syncs automatically with Turf DRS'],
  },
  {
    icon: Camera,
    title: 'Behind the wicket',
    primary: false,
    body: 'Useful for edges, catches, and stumpings when the umpire end camera is partially blocked.',
    tips: ['Wide lens preferred', 'Place behind the keeper at stump height'],
  },
];

const checklist = [
  'Unobstructed view of both sets of stumps',
  'Camera level at roughly stump height',
  'Stable mount — no wobble',
  'Enough light for slow-motion frames',
  'Battery or power connected for the full innings',
  'Turf DRS app open and auto-capture armed',
];

export default function CamerasPage() {
  return (
    <TurfShell>
      <TurfPageHeader
        eyebrow="Cameras"
        title="Get the right angle"
        description="A clear, level shot at the umpire end is all you need. Here's how to set up every camera position."
      />

      <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {positions.map((pos) => (
          <div
            key={pos.title}
            className="group relative overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-teal-500/10"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
            />
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/20 transition-transform duration-300 group-hover:scale-110">
              <pos.icon className="h-5 w-5 text-teal-400" />
            </span>
            <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground">
              {pos.title}
              {pos.primary && (
                <span className="ml-2 inline-block rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-medium text-teal-400">
                  Required
                </span>
              )}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pos.body}</p>
            <ul className="mt-3 space-y-1.5">
              {pos.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-400" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-2xl">
        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-[#0b0b14]/90 px-6 py-7 shadow-xl shadow-black/30 sm:px-8">
          <span
            aria-hidden="true"
            className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/60 to-transparent"
          />
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            Auto-capture checklist
          </h2>
          <ul className="mt-4 space-y-2">
            {checklist.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </TurfShell>
  );
}