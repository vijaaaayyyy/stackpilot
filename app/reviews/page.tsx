import type { Metadata } from 'next';
import { TurfShell, TurfPageHeader } from '@/components/turf/turf-shell';
import { ReviewHistory } from '@/components/reviews/review-history';

export const metadata: Metadata = {
  title: 'Review History',
  description: 'Every Turf DRS review with the original on-field call, final decision, and status.',
  alternates: { canonical: '/reviews' },
};

export default function ReviewsPage() {
  return (
    <TurfShell>
      <TurfPageHeader
        eyebrow="Turf DRS"
        title="Review History"
        description="Card by card — every review you have run, the on-field call, the final decision, and how it changed."
      />

      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />

      <div className="mx-auto mt-12 max-w-3xl">
        <ReviewHistory />
      </div>
    </TurfShell>
  );
}