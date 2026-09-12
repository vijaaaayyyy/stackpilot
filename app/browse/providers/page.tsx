import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, MapPin, Video } from 'lucide-react';
import { DRS_VENUES } from '@/lib/drs/browse';
import { siteConfig, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Browse Turf DRS Venues',
  description:
    'Turf cricket grounds and camera-ready venues — open turfs, covered nets, indoor courts and club grounds set up for Turf DRS reviews.',
  alternates: { canonical: '/browse/providers' },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/browse/providers'),
    title: 'Browse Turf DRS Venues',
    description:
      'Turf cricket grounds and camera-ready venues set up for Turf DRS reviews.',
    siteName: siteConfig.openGraph.siteName,
    locale: siteConfig.openGraph.locale,
    images: [{ url: absoluteUrl('/og.png'), width: 1200, height: 630, alt: siteConfig.name }],
  },
};

export default function BrowseVenuesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="rounded-2xl glass p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
            <Video className="h-4 w-4 text-teal-300" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Browse Venues</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Turf cricket grounds, net facilities and club ovals set up to run Turf DRS — from
          permanent rigs to a portable end camera you can raise in minutes.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {DRS_VENUES.map((venue) => (
          <article key={venue.slug} className="glass glass-hover group flex flex-col rounded-2xl p-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-foreground">
                <Link
                  href={`/browse/providers/${venue.slug}`}
                  className="transition-colors hover:text-teal-300"
                >
                  {venue.name}
                </Link>
              </h2>
              <span className="shrink-0 rounded-full border border-foreground/5 bg-foreground/[0.03] px-2.5 py-1 text-[11px] text-muted-foreground">
                {venue.type}
              </span>
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-white/45">
              <MapPin className="h-3.5 w-3.5" />
              {venue.city}
            </p>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">
              {venue.summary}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 py-2">
                <dt className="text-[10px] font-mono uppercase tracking-widest text-white/35">Strips</dt>
                <dd className="mt-0.5 text-foreground">{venue.strips}</dd>
              </div>
              <div className="rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 py-2">
                <dt className="text-[10px] font-mono uppercase tracking-widest text-white/35">Surface</dt>
                <dd className="mt-0.5 text-foreground">{venue.surface}</dd>
              </div>
            </dl>

            <Link
              href={`/browse/providers/${venue.slug}`}
              className="mt-5 flex w-full items-center justify-between rounded-lg border border-foreground/5 bg-foreground/[0.02] px-4 py-2.5 text-sm text-muted-foreground transition-all hover:border-teal-500/25 hover:bg-foreground/[0.04] hover:text-foreground"
            >
              {venue.rig}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}