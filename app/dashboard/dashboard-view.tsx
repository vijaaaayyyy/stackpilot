'use client';

import {
  Activity,
  ArrowRight,
  Camera,
  ChartNoAxesColumn,
  Clock3,
  Gauge,
  Play,
  Plus,
  Settings2,
  ShieldCheck,
  ShieldX,
  Sparkles,
  Trophy,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { useReviews } from '@/lib/drs/store';
import {
  DEMO_MATCH_ENTRY,
  useClubSettings,
  useMatches,
  usePlayers,
  useTeams,
  type StoredMatch,
} from '@/lib/drs/local-stores';
import type { Decision } from '@/lib/drs/types';
import { AppShell, AppSectionHeader } from '@/components/turf/app-shell';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const DEMO_LIVE_URL =
  '/live?demo=1&match=demo-live&title=Falcons vs Strikers&tournament=Hyderabad Turf League';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function DecisionBadge({ decision }: { decision: Decision }) {
  const out = decision === 'OUT';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1',
        out
          ? 'bg-rose-500/15 text-rose-300 ring-rose-500/25'
          : decision === 'INCONCLUSIVE'
            ? 'bg-amber-500/15 text-amber-300 ring-amber-500/25'
            : 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/25',
      )}
    >
      {out ? <ShieldX className="mr-1 h-3 w-3" /> : <ShieldCheck className="mr-1 h-3 w-3" />}
      {decision}
    </span>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('glass rounded-2xl p-6', className)}>{children}</div>
  );
}

function SectionTitle({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
      {icon}
      {children}
    </h2>
  );
}

function MatchCard({ match }: { match: StoredMatch }) {
  const live = match.status === 'live';
  return (
    <Link
      href={`/live?match=${match.id}&title=${encodeURIComponent(match.title)}&tournament=${encodeURIComponent(match.tournament)}`}
      className="group flex flex-col justify-between gap-4 rounded-2xl border border-foreground/5 bg-foreground/[0.02] p-5 transition-all hover:border-teal-500/25 hover:bg-foreground/[0.04]"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-teal-400">{match.tournament}</span>
        {live ? (
          <span className="flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2 py-0.5 text-[11px] font-semibold text-rose-300 ring-1 ring-rose-500/25">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" /> LIVE
          </span>
        ) : (
          <span className="rounded-full bg-foreground/5 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {match.format}
          </span>
        )}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">vs</p>
        <p className="mt-1 text-lg font-semibold text-foreground">
          {match.team1 || match.title.split(' vs ')[0]} <span className="text-muted-foreground">vs</span>{' '}
          {match.team2 || match.title.split(' vs ')[1]}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Trophy className="h-3.5 w-3.5" /> {match.venue}
        </p>
      </div>
      <div className="flex items-center gap-2 text-xs font-medium text-teal-400">
        Open match <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export function DashboardView() {
  const { user, loading } = useAuth();
  const matches = useMatches();
  const teams = useTeams();
  const players = usePlayers();
  const settings = useClubSettings();
  const { reviews, loading: reviewsLoading } = useReviews();

  const allMatches =
    matches.some((match) => match.id === 'demo-live') ? matches : [DEMO_MATCH_ENTRY, ...matches];
  const liveMatches = allMatches
    .filter((match) => match.status === 'live' || match.id === 'demo-live')
    .slice(0, 4);
  const myMatches = allMatches.filter((match) => match.id !== 'demo-live');
  const recentReviews = reviews.slice(0, 5);

  const name =
    (user?.user_metadata?.name as string | undefined) ??
    user?.email?.split('@')[0] ??
    'Umpire';

  const stats = [
    { icon: Gauge, label: 'Live matches', value: liveMatches.length },
    { icon: Activity, label: 'Recent reviews', value: reviews.length },
    { icon: Users, label: 'Players', value: players.length },
    { icon: Trophy, label: 'Teams', value: teams.length },
  ];

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <section className="rounded-3xl border border-foreground/5 bg-gradient-to-br from-teal-500/10 via-transparent to-cyan-500/10 p-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-teal-400">
                {greeting()}{mounted ? ` — ${settings.turfName || 'Turf DRS'}` : ''}
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                Welcome back, {name}.
              </h1>
              <p className="mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
                Set up a match, run the live feed, and make review calls from the third umpire
                workstation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild className="h-11 rounded-xl bg-teal-500 px-6 text-white shadow-lg shadow-teal-500/25 hover:bg-teal-600">
                <Link href="/create-match">
                  <Plus className="h-4 w-4" /> Start New Match
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 rounded-xl border-foreground/10 px-6 text-foreground hover:bg-foreground/5"
              >
                <Link href={DEMO_LIVE_URL}>
                  <Play className="h-4 w-4" /> Open Demo Match
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-500/10 ring-1 ring-teal-500/20">
                <stat.icon className="h-4 w-4 text-teal-300" />
              </span>
              <p className="mt-3 text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </Card>
          ))}
        </section>

        {/* Live / recent matches */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<Play className="h-3.5 w-3.5" />}>Live matches</SectionTitle>
            <Link href="/matches" className="text-xs font-medium text-teal-400 hover:text-teal-300">
              View all
            </Link>
          </div>
          {liveMatches.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {liveMatches.map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-start gap-4">
              <p className="text-sm text-muted-foreground">
                No matches running. Create a match or open the demo feed.
              </p>
              <Button asChild variant="outline" className="border-foreground/10 text-foreground">
                <Link href="/create-match">Create match</Link>
              </Button>
            </Card>
          )}
        </section>

        {/* Recent reviews */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<Activity className="h-3.5 w-3.5" />}>Recent reviews</SectionTitle>
            <Link href="/reviews" className="text-xs font-medium text-teal-400 hover:text-teal-300">
              Review history
            </Link>
          </div>
          <Card className="p-0">
            {reviewsLoading ? (
              <p className="p-6 text-sm text-muted-foreground">Loading reviews…</p>
            ) : recentReviews.length === 0 ? (
              <div className="flex flex-col items-start gap-3 p-6">
                <p className="text-sm text-muted-foreground">
                  No reviews yet. Run a delivery in the live match and request a review.
                </p>
                <Button asChild className="bg-teal-500 text-white hover:bg-teal-600">
                  <Link href={DEMO_LIVE_URL}>Watch the live delivery</Link>
                </Button>
              </div>
            ) : (
              <ul className="divide-y divide-foreground/5">
                {recentReviews.map((review) => (
                  <li key={review.id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {review.matchLabel} · {review.ballId}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">{review.type} review</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">{review.onField} on field</span>
                      <DecisionBadge decision={review.decision} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        {/* Teams strip */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<Trophy className="h-3.5 w-3.5" />}>My teams</SectionTitle>
            <Link href="/teams" className="text-xs font-medium text-teal-400 hover:text-teal-300">
              Manage
            </Link>
          </div>
          {teams.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {teams.map((team) => (
                <span
                  key={team.id}
                  className="inline-flex items-center gap-2 rounded-xl border border-foreground/5 bg-foreground/[0.02] px-4 py-2 text-sm font-medium text-foreground"
                >
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                  {team.name}
                  <span className="text-xs uppercase text-muted-foreground">{team.short}</span>
                </span>
              ))}
            </div>
          ) : (
            <Card className="flex flex-col items-start gap-4">
              <p className="text-sm text-muted-foreground">
                Add your turf teams to quickly load line-ups when creating a match.
              </p>
              <Button asChild variant="outline" className="border-foreground/10 text-foreground">
                <Link href="/teams">Add a team</Link>
              </Button>
            </Card>
          )}
        </section>

        {/* Quick actions */}
        <section className="space-y-4">
          <SectionTitle icon={<Sparkles className="h-3.5 w-3.5" />}>Quick actions</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: Camera, label: 'Cameras', href: '/cameras', hint: '2/3 online' },
              { icon: ChartNoAxesColumn, label: 'Analytics', href: '/analytics', hint: 'Decision reports' },
              { icon: Settings2, label: 'Settings', href: '/settings', hint: 'Turf & preference' },
            ].map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="group flex items-center gap-4 rounded-2xl border border-foreground/5 bg-foreground/[0.02] p-5 transition-all hover:border-teal-500/25 hover:bg-foreground/[0.04]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/20">
                  <item.icon className="h-4 w-4 text-teal-300" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock3 className="h-3 w-3" /> {item.hint}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* My matches */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <SectionTitle icon={<Play className="h-3.5 w-3.5" />}>My matches</SectionTitle>
            <Link href="/matches" className="text-xs font-medium text-teal-400 hover:text-teal-300">
              View all
            </Link>
          </div>
          {myMatches.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myMatches.slice(0, 3).map((match) => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          ) : (
            <Card>
              <p className="text-sm text-muted-foreground">
                Your created matches will appear here. Create your first match to get started.
              </p>
            </Card>
          )}
        </section>
      </div>
    </AppShell>
  );
}