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
      'Broadcast-style third umpire workstation. Upload a clip or record live — AI line-by-line evidence, slow-mo, frame-by-frame, and an OUT / NOT OUT decision.',
    alternates: { canonical: '/review' },
  };
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const params = await searchParams;
  const clip = params?.clip?.trim();

  /* With review params -> the workstation. A `clip` param means a standalone
     uploaded video review; otherwise it is the live console flow. */
  if (params?.type || params?.ball || clip) {
    const standalone = Boolean(clip);
    const from = clip
      ? 'upload'
      : params.from === 'history' || params.from === 'demo'
        ? params.from
        : 'live';

    return (
      <ReviewWorkstation
        type={params?.type ?? 'lbw'}
        clipId={clip}
        standalone={standalone}
        ball={clip ?? params?.ball ?? '16.4'}
        from={from}
        matchId={params?.match ?? (standalone ? 'standalone' : 'demo-live')}
        matchLabel={
          standalone
            ? 'Standalone review'
            : params?.title?.trim() || 'Falcons vs Strikers · Hyderabad Turf League'
        }
      />
    );
  }

  return (
    <TurfShell>
      <TurfPageHeader
        eyebrow="Turf DRS"
        title="Third-Umpire"
        highlight="Review Deck"
        description="Review any delivery — upload a clip from your phone or record it live. Turf DRS AI pins the evidence, you rule on it."
      />
      <div className="mt-12">
        <ReviewHub />
      </div>
    </TurfShell>
  );
}