import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Camera,
  Gavel,
  MapPin,
  Trophy,
  Users,
} from 'lucide-react';
import { DRS_REVIEW_TYPES, DRS_VENUES } from '@/lib/drs/browse';
import { siteConfig, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Browse Turf DRS',
  description:
    'Browse Turf DRS — matches, reviews, players, teams, cameras and venues. Professional cricket reviews for local matches, turf cricket, academies and clubs.',
  alternates: { canonical: '/browse' },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/browse'),
    title: 'Browse Turf DRS',
    description:
      'Matches, reviews, players, teams, cameras and venues for Turf DRS cricket reviews.',
    siteName: siteConfig.openGraph.siteName,
    locale: siteConfig.openGraph.locale,
    images: [{ url: absoluteUrl('/og.png'), width: 1200, height: 630, alt: siteConfig.name }],
  },
};

const demoMatch = {
  title: 'Falcons vs Strikers',
  tournament: 'Hyderabad Turf League',
  venue: 'Hyderabad Turf Arena',
  format: 'T20 · Match 12',
  status: 'Live',
};

const demoPlayers = [
  { name: 'Rohit Sharma', team: 'Falcons', role: 'Batter' },
  { name: 'Virat Kohli', team: 'Falcons', role: 'Batter' },
  { name: 'Rashid Khan', team: 'Falcons', role: 'All-rounder' },
  { name: 'Pat Cummins', team: 'Falcons', role: 'Bowler' },
  { name: 'Andre Russell', team: 'Strikers', role: 'All-rounder' },
  { name: 'Jasprit Bumrah', team: 'Strikers', role: 'Bowler' },
];

const cameraRigs = [
  { name: 'End camera', note: 'Behind the bowler for stumps, creases and bails' },
  { name: 'Top camera', note: 'Overhead for the pitch map and flying stumps' },
  { name: 'Rope camera', note: 'Boundary and catch checks from the rope' },
];

export default function BrowsePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="rounded-2xl glass p-6 sm:p-8">
        <p className="text-sm font-medium text-teal-400">Browse</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Browse <span className="gradient-text">Turf DRS</span>
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
          Matches, decisions, squads, camera rigs and grounds — everything that makes up a
          local review system, in one place.
        </p>
      </div>

      {/* Matches */}
      <section className="rounded-2xl glass p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
              <CalendarDays className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Matches</h2>
              <p className="text-xs text-muted-foreground">Live fixtures and reviews</p>
            </div>
          </div>
          <Link
            href="/live"
            className="flex items-center gap-1.5 text-sm font-medium text-teal-300 transition-colors hover:text-teal-200"
          >
            Watch live <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link
            href="/live"
            className="glass glass-hover group flex flex-col rounded-2xl p-5 transition-all"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-medium text-rose-300">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400" />
                {demoMatch.status}
              </span>
              <span className="text-[11px] font-mono uppercase tracking-widest text-white/40">
                {demoMatch.format}
              </span>
            </div>
            <h3 className="mt-3 text-xl font-semibold text-foreground">{demoMatch.title}</h3>
            <p className="mt-1 text-sm text-white/45">{demoMatch.tournament}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" /> {demoMatch.venue}
            </p>
            <span className="mt-4 flex w-fit items-center gap-1.5 text-sm font-medium text-teal-300">
              Ball tracking + replay
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <div className="glass flex flex-col rounded-2xl p-5">
            <h3 className="text-sm font-medium text-foreground">Start a review</h3>
            <p className="mt-1.5 flex-1 text-sm leading-relaxed text-muted-foreground">
              Run an instant LBW, run out or caught behind decision on the live demo delivery —
              no setup needed.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {DRS_REVIEW_TYPES.filter((item) => ['lbw', 'runout', 'caught'].includes(item.slug)).map(
                (item) => (
                  <Link
                    key={item.slug}
                    href={item.ctaHref}
                    className="rounded-full border border-foreground/5 bg-foreground/[0.03] px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-teal-500/25 hover:text-foreground"
                  >
                    {item.name}
                  </Link>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="rounded-2xl glass p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
              <Gavel className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Reviews</h2>
              <p className="text-xs text-muted-foreground">Every decision Turf DRS can settle</p>
            </div>
          </div>
          <Link
            href="/browse/categories"
            className="flex items-center gap-1.5 text-sm font-medium text-teal-300 transition-colors hover:text-teal-200"
          >
            All review types <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {DRS_REVIEW_TYPES.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.slug}
                href={`/browse/categories/${item.slug}`}
                className="glass glass-hover group rounded-2xl p-4 transition-all"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-foreground/10">
                  <Icon className="h-4 w-4 text-teal-300" />
                </div>
                <h3 className="mt-3 text-sm font-semibold text-foreground">{item.name}</h3>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.short}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Teams + Players */}
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl glass p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-teal-500/20 ring-1 ring-amber-500/20">
                <Trophy className="h-5 w-5 text-amber-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Teams</h2>
                <p className="text-xs text-muted-foreground">Clubs across the local leagues</p>
              </div>
            </div>
            <Link
              href="/teams"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-teal-300"
            >
              Manage <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Falcons', 'Strikers', 'Eagles', 'Titans', 'Royals', 'Dragons'].map((team) => (
              <span
                key={team}
                className="rounded-lg border border-foreground/5 bg-foreground/[0.03] px-3 py-1.5 text-sm text-foreground"
              >
                {team}
              </span>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            Create and manage your own clubs and squads from your dashboard.
          </p>
        </div>

        <div className="rounded-2xl glass p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/20">
                <Users className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Players</h2>
                <p className="text-xs text-muted-foreground">Featured batters and bowlers</p>
              </div>
            </div>
            <Link
              href="/players"
              className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-teal-300"
            >
              Manage <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <ul className="mt-5 space-y-2.5">
            {demoPlayers.map((player) => (
              <li
                key={player.name}
                className="flex items-center justify-between gap-2 rounded-xl border border-foreground/5 bg-foreground/[0.02] px-3.5 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{player.name}</p>
                  <p className="text-[11px] text-muted-foreground">{player.team}</p>
                </div>
                <span className="rounded-full bg-foreground/[0.04] px-2 py-0.5 text-[11px] text-white/45">
                  {player.role}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Cameras */}
      <section className="rounded-2xl glass p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
              <Camera className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Cameras</h2>
              <p className="text-xs text-muted-foreground">The rigs that make local reviews possible</p>
            </div>
          </div>
          <Link
            href="/cameras"
            className="flex items-center gap-1.5 text-sm font-medium text-teal-300 transition-colors hover:text-teal-200"
          >
            Setup guide <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {cameraRigs.map((cam) => (
            <div key={cam.name} className="rounded-xl border border-foreground/5 bg-foreground/[0.02] p-4">
              <p className="text-sm font-medium text-foreground">{cam.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{cam.note}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Venues */}
      <section className="rounded-2xl glass p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
              <MapPin className="h-5 w-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">Venues</h2>
              <p className="text-xs text-muted-foreground">Camera-ready grounds and facilities</p>
            </div>
          </div>
          <Link
            href="/browse/providers"
            className="flex items-center gap-1.5 text-sm font-medium text-teal-300 transition-colors hover:text-teal-200"
          >
            All venues <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {DRS_VENUES.slice(0, 6).map((venue) => (
            <Link
              key={venue.slug}
              href={`/browse/providers/${venue.slug}`}
              className="glass glass-hover group rounded-2xl p-4 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">{venue.name}</h3>
                <span className="shrink-0 rounded-full border border-foreground/5 bg-foreground/[0.03] px-2 py-0.5 text-[11px] text-muted-foreground">
                  {venue.type}
                </span>
              </div>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
                <MapPin className="h-3 w-3" /> {venue.city}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{venue.summary}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}