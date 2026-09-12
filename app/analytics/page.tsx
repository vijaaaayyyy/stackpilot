'use client';

import { Activity, CheckCheck, Play, ShieldX, Trophy, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useReviews } from '@/lib/drs/store';
import { useMatches, usePlayers, useTeams } from '@/lib/drs/local-stores';
import { AppShell, AppSectionHeader } from '@/components/turf/app-shell';
import { cn } from '@/lib/utils';

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-6">
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 ring-1 ring-teal-500/20">
        <Icon className="h-4 w-4 text-teal-300" />
      </span>
      <p className="mt-3 text-2xl font-semibold text-foreground">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Bar({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="capitalize text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {count} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-foreground/5">
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${Math.max(pct, 2)}%` }} />
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const { reviews, loading } = useReviews();
  const matches = useMatches();
  const teams = useTeams();
  const players = usePlayers();

  const outs = reviews.filter((review) => review.decision === 'OUT').length;
  const notOuts = reviews.filter((review) => review.decision === 'NOT OUT').length;
  const inconclusive = reviews.filter((review) => review.decision === 'INCONCLUSIVE').length;
  const challenged = reviews.filter((review) => review.onField === 'OUT').length;
  const overturned = reviews.filter(
    (review) => review.onField === 'OUT' && review.decision === 'NOT OUT',
  ).length;
  const total = reviews.length;

  return (
    <AppShell>
      <div className="space-y-8">
        <AppSectionHeader eyebrow="Turf DRS · Insights" title="Analytics" />

        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Stat icon={Activity} label="Total reviews" value={total} />
          <Stat icon={Play} label="Matches" value={matches.length} />
          <Stat icon={Trophy} label="Teams" value={teams.length} />
          <Stat icon={Users} label="Players" value={players.length} />
        </section>

        <section className="space-y-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Decision split
          </h2>
          <div className="glass space-y-5 rounded-2xl p-6">
            <Bar label="OUT" count={outs} total={total} tone="bg-rose-500" />
            <Bar label="NOT OUT" count={notOuts} total={total} tone="bg-emerald-500" />
            <Bar label="Inconclusive" count={inconclusive} total={total} tone="bg-amber-500" />
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <CheckCheck className="h-4 w-4" /> Challenge outcomes
            </div>
            <p className="mt-3 text-2xl font-semibold text-foreground">
              {challenged > 0 ? Math.round((overturned / challenged) * 100) : 0}%
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {overturned} of {challenged} OUT challenges overturned
            </p>
          </div>
          <div className="glass rounded-2xl p-6">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <ShieldX className="h-4 w-4" /> Latest call
            </div>
            {loading ? (
              <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
            ) : reviews.length > 0 ? (
              <>
                <p className="mt-3 text-xl font-semibold capitalize text-foreground">
                  {reviews[0].type} · {reviews[0].decision}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {reviews[0].matchLabel} · {reviews[0].ballId}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No reviews recorded yet. Complete a review to see call stats.
              </p>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}