import type { Metadata } from 'next';
import { ReviewConsole } from '@/components/live/review-console';
import { TurfShell, TurfPageHeader } from '@/components/turf/turf-shell';

export const metadata: Metadata = {
  title: 'Live Camera — Turf DRS',
  description: 'Rolling-camera review console — record the delivery from the umpire end and route it to the Turf DRS review player.',
  alternates: { canonical: '/live' },
};

export default function LivePage() {
  return (
    <TurfShell>
      <TurfPageHeader
        eyebrow="Turf DRS"
        title="Live Camera"
        highlight="Review Console"
        description="Keep the ball in a rolling buffer at the umpire end, then send each delivery to the review player as a standalone clip."
      />

      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-rose-500/10 blur-[120px]" />

      <ReviewConsole />
    </TurfShell>
  );
}