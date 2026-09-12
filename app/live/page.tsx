import type { Metadata } from 'next';
import { LiveMatchView } from '@/components/live/live-match-view';
import { TurfShell, TurfPageHeader } from '@/components/turf/turf-shell';
import type { Decision, Review, ReviewStatus, ReviewTypeId } from '@/lib/drs/types';

export const metadata: Metadata = {
  title: 'Live Match',
  description: 'Follow the live match, ball by ball, and request Turf DRS reviews.',
  alternates: { canonical: '/live' },
};

const DECISIONS = new Set(['OUT', 'NOT OUT', 'INCONCLUSIVE']);
const STATUSES = new Set(['UPHELD', 'OVERTURNED', 'INCONCLUSIVE']);

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

  const initialReview: Review | null =
    params.review && DECISIONS.has(params.review)
      ? {
          id: `live-${Date.now()}`,
          matchId: params.match ?? 'demo-live',
          matchLabel,
          ballId: params.ball ?? '16.4',
          type: (params.type as ReviewTypeId) ?? 'lbw',
          onField: 'NOT OUT',
          decision: params.review as Decision,
          status: (params.status as ReviewStatus) ?? 'INCONCLUSIVE',
          reason: '',
          createdAt: Date.now(),
        }
      : null;

  return (
    <TurfShell>
      <TurfPageHeader
        eyebrow={tournament}
        title={title}
        highlight="LIVE"
        description={
          demo
            ? 'Interactive demo running — watch the delivery, request the review, and decide it in the workstation.'
            : 'Strikers 142/5 in 16.4 overs · Chasing 143 · 48 needed off 21 balls.'
        }
      />

      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-rose-500/10 blur-[120px]" />

      <LiveMatchView
        demo={demo}
        matchId={params.match ?? 'demo-live'}
        matchLabel={matchLabel}
        initialReview={initialReview}
      />
    </TurfShell>
  );
}