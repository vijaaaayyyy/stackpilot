import type { Metadata } from 'next';
import { ReviewConsole } from '@/components/live/review-console';
import { TurfShell, TurfPageHeader } from '@/components/turf/turf-shell';

export const metadata: Metadata = {
  title: 'Live Match',
  description: 'Rolling camera review console — record each delivery and send it to the Turf DRS review player.',
  alternates: { canonical: '/live' },
};

export default async function LiveMatchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const demo = params.demo === '1';
  const title = params.title?.trim() || 'Falcons vs Strikers';
  const tournament = params.tournament?.trim() || 'Hyderabad Turf League';
  const matchLabel = `${title} · ${tournament}`;

  return (
    <TurfShell>
      <TurfPageHeader
        eyebrow={tournament}
        title={title}
        highlight="LIVE"
        description={
          demo
            ? 'Rolling-buffer review console — record the delivery, then send it to the review player.'
            : 'Review console — record each delivery at the umpire end and route it to Turf DRS.'
        }
      />

      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-rose-500/10 blur-[120px]" />

      <ReviewConsole
        demo={demo}
        matchId={params.match ?? 'demo-live'}
        matchLabel={matchLabel}
        justReviewedBall={params.ball ?? null}
      />
    </TurfShell>
  );
}