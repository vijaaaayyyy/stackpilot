import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check, MapPin, PlayCircle, Videotape } from 'lucide-react';
import { DRS_VENUES, getAllVenues, getVenueBySlug } from '@/lib/drs/browse';
import { siteConfig, absoluteUrl } from '@/lib/site';

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllVenues().map((venue) => ({ slug: venue.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const venue = getVenueBySlug(params.slug);
  if (!venue) return {};
  const canonical = `/browse/providers/${venue.slug}`;
  return {
    title: venue.name,
    description: venue.summary,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: absoluteUrl(canonical),
      title: venue.name,
      description: venue.summary,
      siteName: siteConfig.openGraph.siteName,
      locale: siteConfig.openGraph.locale,
      images: [{ url: absoluteUrl('/og.png'), width: 1200, height: 630, alt: siteConfig.name }],
    },
  };
}

export default function VenuePage({ params }: Props) {
  const venue = getVenueBySlug(params.slug);
  if (!venue) notFound();

  const stats = [
    { label: 'Type', value: venue.type },
    { label: 'City', value: venue.city },
    { label: 'Strips', value: String(venue.strips) },
    { label: 'Surface', value: venue.surface },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link
        href="/browse/providers"
        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to venues
      </Link>

      <div className="rounded-2xl glass p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
            <MapPin className="h-7 w-7 text-teal-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{venue.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
              <MapPin className="h-3.5 w-3.5" />
              {venue.city} · {venue.type}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{venue.summary}</p>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 py-2">
              <dt className="text-[10px] font-mono uppercase tracking-widest text-white/35">
                {stat.label}
              </dt>
              <dd className="mt-0.5 text-sm text-foreground">{stat.value}</dd>
            </div>
          ))}
        </div>
      </div>

      <section className="rounded-2xl glass p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Videotape className="h-4 w-4 text-teal-300" />
          Camera rig
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{venue.rig}.</p>
      </section>

      <section className="rounded-2xl glass p-6">
        <h2 className="text-sm font-semibold text-foreground">What&apos;s here</h2>
        <ul className="mt-4 space-y-3">
          {venue.highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
              {highlight}
            </li>
          ))}
        </ul>
        {venue.features.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {venue.features.map((feature) => (
              <span
                key={feature}
                className="rounded-full border border-foreground/5 bg-foreground/[0.03] px-2.5 py-1 text-[11px] text-muted-foreground"
              >
                {feature}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row">
        <Link
          href="/cameras"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-teal-500/25 bg-teal-500/10 px-4 py-3 text-sm font-medium text-teal-200 transition-colors hover:bg-teal-500/20"
        >
          <Videotape className="h-4 w-4" />
          See camera setup
        </Link>
        <Link
          href="/live?demo=1"
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-foreground/5 bg-foreground/[0.02] px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
        >
          <PlayCircle className="h-4 w-4" />
          Watch live demo match
        </Link>
      </div>
    </div>
  );
}