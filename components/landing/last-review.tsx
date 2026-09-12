import Link from 'next/link';
import { ChevronRight, ShieldAlert, Sparkles, Video } from 'lucide-react';
import { getRouteSession } from '@/lib/supabase/route-user';
import { cn } from '@/lib/utils';

type LastReviewRow = {
  id: string;
  type: string | null;
  decision: string | null;
  on_field: string | null;
  status: string | null;
  reason: string | null;
  ball_id: string;
  match_label: string;
  created_at: string;
  clip_path: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  lbw: 'LBW',
  caught: 'Caught behind',
  runout: 'Run out',
  stumping: 'Stumping',
  boundary: 'Boundary',
};

const DECISION_TONE: Record<string, string> = {
  OUT: 'text-rose-300',
  'NOT OUT': 'text-emerald-300',
  INCONCLUSIVE: 'text-amber-300',
};

function timeAgo(ts: number): string {
  const delta = Math.max(0, Date.now() - ts);
  const minutes = Math.floor(delta / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ReviewRow({
  eyebrow,
  kicker,
  type,
  decision,
  onField,
  status,
  reason,
  meta,
  createdAt,
  href,
  sample = false,
}: {
  eyebrow: string;
  kicker: string;
  type: string;
  decision: string;
  onField: string;
  status: string;
  reason: string;
  meta: string;
  createdAt: number;
  href: string;
  sample?: boolean;
}) {
  const statusTone =
    status === 'OVERTURNED'
      ? 'bg-amber-400/10 text-amber-300 ring-amber-400/25'
      : status === 'UPHELD'
        ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/25'
        : 'bg-white/5 text-white/50 ring-white/15';
  const decisionTone = DECISION_TONE[decision] ?? 'text-white/70';

  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-3xl gradient-border transition-transform hover:-translate-y-0.5"
    >
      <div className="pointer-events-none absolute -left-24 top-0 h-full w-48 -rotate-12 bg-gradient-to-b from-amber-400/[0.07] to-transparent" />
      <div className="relative grid gap-6 p-6 sm:p-8 lg:grid-cols-[auto_1fr_auto] lg:items-center">
        {/* Verdict */}
        <div className="flex items-start gap-6 lg:flex-col lg:items-center">
          <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl border border-rose-400/25 bg-rose-500/[0.08] sm:h-24 sm:w-24">
            <span
              className={cn(
                'font-mono text-lg font-black tracking-tight sm:text-2xl',
                decisionTone,
                decision === 'OUT' && 'text-rose-300',
                decision === 'NOT OUT' && 'text-emerald-300',
                decision === 'INCONCLUSIVE' && 'text-amber-300',
              )}
            >
              {decision}
            </span>
            <span className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.25em] text-white/35">
              Decision
            </span>
          </div>
        </div>

        {/* Details */}
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-amber-300">
            <Sparkles className="h-3.5 w-3.5" />
            {eyebrow}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h3 className="text-lg font-semibold tracking-tight text-foreground sm:text-xl">
              {kicker}
            </h3>
            <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-white/60">
              {type}
            </span>
            <span className={cn('rounded-full px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ring-1', statusTone)}>
              {status}
            </span>
          </div>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/55">{reason}</p>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-white/35">
            {meta} · {timeAgo(createdAt)} · {sample ? 'demo sample' : onField}
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3 lg:items-center lg:justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] px-3.5 py-2 font-mono text-[10px] font-semibold uppercase tracking-widest text-white/60 ring-1 ring-white/10 transition-colors group-hover:text-white">
            <Video className="h-3.5 w-3.5" />
            {sample ? 'Try the review deck' : 'Open review'}
            <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

const DEMO_REVIEW: LastReviewRow = {
  id: 'demo-latest',
  type: 'lbw',
  decision: 'OUT',
  on_field: 'NOT OUT',
  status: 'OVERTURNED',
  reason:
    'Pitch impact in line with the stumps, below the bails; the projected path carries onto the middle stump.',
  ball_id: '16.4',
  match_label: 'Sample delivery',
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  clip_path: null,
};

export async function LastReview() {
  let href = '/review';
  let sample = true;
  let row: LastReviewRow = DEMO_REVIEW;

  try {
    const session = await getRouteSession();
    if (session?.supabase && session.user) {
      const { data } = await session.supabase
        .from('drs_reviews')
        .select(
          'id, type, decision, on_field, status, reason, ball_id, match_label, created_at, clip_path',
        )
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const latest = (data ?? [])[0] as LastReviewRow | undefined;
      if (latest) {
        row = latest;
        href = '/reviews';
        sample = false;
      }
    }
  } catch {
    /* demo sample on any auth/DB hiccup */
  }

  return (
    <section id="last-review" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-300">
              <ShieldAlert className="h-4 w-4" />
              Third Umpire · Latest decision
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {sample ? 'Every delivery is reviewable' : 'Resume where you left off'}
            </h2>
          </div>
        </div>

        <ReviewRow
          eyebrow={sample ? 'Sample review' : 'Your latest review'}
          kicker={sample ? 'LBW — projected path onto the stumps' : (TYPE_LABEL[(row.type ?? '').toLowerCase()] ?? 'Review')}
          type={TYPE_LABEL[(row.type ?? 'lbw').toLowerCase()] ?? 'Review'}
          decision={row.decision ?? 'INCONCLUSIVE'}
          onField={row.on_field ?? 'INCONCLUSIVE'}
          status={row.status ?? 'INCONCLUSIVE'}
          reason={row.reason || 'No reasoning was recorded for this review.'}
          meta={row.ball_id}
          createdAt={new Date(row.created_at ?? Date.now()).getTime()}
          href={href}
          sample={sample}
        />

        {sample && (
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
            Showing a sample decision — upload a clip or sign in to see your own reviews here.
          </p>
        )}
      </div>
    </section>
  );
}