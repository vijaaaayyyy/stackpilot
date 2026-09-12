'use client';

import Link from 'next/link';
import { ArrowRight, Play, Plus, Trash2, Trophy } from 'lucide-react';
import {
  DEMO_MATCH_ENTRY,
  deleteMatch,
  useMatches,
  type StoredMatch,
} from '@/lib/drs/local-stores';
import { AppShell, AppSectionHeader } from '@/components/turf/app-shell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function liveUrl(match: StoredMatch): string {
  return `/live?match=${match.id}&title=${encodeURIComponent(match.title)}&tournament=${encodeURIComponent(match.tournament)}`;
}

export default function MatchesPage() {
  const matches = useMatches();
  const allMatches = matches.some((match) => match.id === 'demo-live')
    ? matches
    : [DEMO_MATCH_ENTRY, ...matches];

  const live = allMatches.filter((match) => match.status === 'live' || match.id === 'demo-live');
  const finished = allMatches.filter((match) => match.id !== 'demo-live' && match.status !== 'live');

  const renderRow = (match: StoredMatch) => {
    const isLive = match.id === 'demo-live' || match.status === 'live';
    const isDemo = match.id === 'demo-live';
    return (
      <li
        key={match.id}
        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-foreground/5 bg-foreground/[0.02] px-5 py-4 transition-colors hover:border-teal-500/20"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1',
                isLive
                  ? 'bg-rose-500/15 text-rose-300 ring-rose-500/25'
                  : 'bg-foreground/5 text-muted-foreground ring-foreground/10',
              )}
            >
              {isLive ? (isDemo ? 'DEMO · LIVE' : 'LIVE') : 'FINISHED'}
            </span>
            <p className="text-base font-semibold text-foreground">{match.title}</p>
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5" /> {match.tournament} · {match.venue} · {match.format}
            {match.overs ? ` (${match.overs})` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline" className="h-9 border-foreground/10 text-foreground">
            <Link href={liveUrl(match)}>
              <Play className="h-3.5 w-3.5" /> Open
            </Link>
          </Button>
          {!isDemo && (
            <Button
              variant="ghost"
              className="h-9 px-2 text-muted-foreground hover:text-rose-400"
              onClick={() => deleteMatch(match.id)}
              aria-label={`Delete ${match.title}`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </li>
    );
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <AppSectionHeader
          eyebrow="Turf DRS · Schedule"
          title="Matches"
          action={
            <Button asChild className="h-10 rounded-xl bg-teal-500 text-white hover:bg-teal-600">
              <Link href="/create-match">
                <Plus className="h-4 w-4" /> New Match
              </Link>
            </Button>
          }
        />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Live & ready
          </h2>
          {live.length > 0 ? (
            <ul className="space-y-3">{live.map(renderRow)}</ul>
          ) : (
            <p className="text-sm text-muted-foreground">No live matches. Create one to get going.</p>
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Finished
          </h2>
          {finished.length > 0 ? (
            <ul className="space-y-3">{finished.map(renderRow)}</ul>
          ) : (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              Nothing finished yet. <ArrowRight className="h-3.5 w-3.5" />
            </p>
          )}
        </section>
      </div>
    </AppShell>
  );
}