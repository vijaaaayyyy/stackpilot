import type { Metadata } from 'next';
import { TurfShell, TurfPageHeader } from '@/components/turf/turf-shell';
import { ReviewWorkstation } from '@/components/review/review-workstation';
import { ReviewHub } from '@/components/review/review-hub';

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
      'Broadcast-style third umpire workstation. Upload a clip or record live — the actual clip plays frame-by-frame with the real audio strip, AI evidence, and an OUT / NOT OUT decision.',
    alternates: { canonical: '/review' },
  };
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const clip = params?.clip?.trim() || params?.ball?.trim() || '';

  /* With a clip -> the workstation (a standalone uploaded/live-captured clip). */
  if (params?.type || clip) {
    const from = params?.from === 'history' ? 'history' : params?.from === 'demo' ? 'demo' : params?.from === 'live' ? 'live' : 'upload';

    return <ReviewWorkstation type={params?.type ?? 'lbw'} clipId={clip} from={from} />;
  }

  return (
    <TurfShell>
      <TurfPageHeader
        eyebrow="Turf DRS"
        title="Third-Umpire"
        highlight="Review Deck"
        description="Review any delivery — upload a clip from your phone or record it live. Turf DRS AI pins the evidence on the real footage, you rule on it."
      />
      <div className="mt-12">
        <ReviewHub />
      </div>
    </TurfShell>
  );
}