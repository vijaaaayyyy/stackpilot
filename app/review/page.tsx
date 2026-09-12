import type { Metadata } from 'next';
import { ReviewWorkstation } from '@/components/review/review-workstation';

type ReviewPageProps = {
  searchParams: Record<string, string | undefined>;
};

function reviewTitle(type?: string): string {
  const t = (type || 'lbw').toLowerCase().replace('run-out', 'runout');
  const map: Record<string, string> = {
    lbw: 'LBW Review',
    caught: 'Caught Behind Review',
    runout: 'Run Out Review',
    stumping: 'Stumping Review',
    boundary: 'Boundary Review',
  };
  return (map[t] as string | undefined) ?? 'Third Umpire Review';
}

export async function generateMetadata({ searchParams }: ReviewPageProps): Promise<Metadata> {
  const params = await searchParams;
  const type = params?.type || 'lbw';

  return {
    title: `${reviewTitle(type)} — Turf DRS`,
    description:
      'Broadcast-style third umpire workstation. Slow-mo, ball tracking, frame-by-frame, and a final OUT / NOT OUT decision for the match.',
    alternates: { canonical: '/review' },
  };
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const from =
    params.from === 'history' || params.from === 'demo' ? params.from : 'live';

  return (
    <ReviewWorkstation
      type={params.type ?? 'lbw'}
      ball={params.ball ?? '16.4'}
      from={from}
      matchId={params.match ?? 'demo-live'}
      matchLabel={
        params.title?.trim() || 'Falcons vs Strikers · Hyderabad Turf League'
      }
    />
  );
}