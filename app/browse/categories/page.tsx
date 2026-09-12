import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Gavel } from 'lucide-react';
import { DRS_REVIEW_TYPES } from '@/lib/drs/browse';
import { siteConfig, absoluteUrl } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Browse DRS Review Types',
  description:
    'Browse every Turf DRS decision — LBW, run out, stumping, caught behind and boundary reviews, plus ball tracking and instant replays.',
  alternates: { canonical: '/browse/categories' },
  openGraph: {
    type: 'website',
    url: absoluteUrl('/browse/categories'),
    title: 'Browse DRS Review Types',
    description:
      'Every Turf DRS decision — LBW, run out, stumping, caught behind and boundary reviews.',
    siteName: siteConfig.openGraph.siteName,
    locale: siteConfig.openGraph.locale,
    images: [{ url: absoluteUrl('/og.png'), width: 1200, height: 630, alt: siteConfig.name }],
  },
};

export default function BrowseCategoriesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-10">
      <div className="rounded-2xl glass p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
            <Gavel className="h-4 w-4 text-teal-300" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Browse Review Types</h1>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Every decision Turf DRS can review — from LBW to boundaries — each backed by its own
          camera angle and frame-accurate replay.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {DRS_REVIEW_TYPES.map((item) => {
          const Icon = item.icon;
          return (
            <article key={item.slug} className="glass glass-hover group rounded-2xl p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-foreground/10 transition-transform group-hover:scale-110">
                <Icon className="h-6 w-6 text-teal-300" />
              </div>
              <h2 className="mt-5 text-lg font-semibold text-foreground">
                <Link
                  href={`/browse/categories/${item.slug}`}
                  className="transition-colors hover:text-teal-300"
                >
                  {item.name}
                </Link>
              </h2>
              <p className="mt-1 text-[11px] font-mono uppercase tracking-widest text-white/40">
                {item.short}
              </p>
              <p className="mt-3 min-h-[48px] text-sm leading-relaxed text-muted-foreground">
                {item.summary}
              </p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {item.checks.map((check) => (
                  <span
                    key={check}
                    className="rounded-full border border-foreground/5 bg-foreground/[0.03] px-2.5 py-1 text-[11px] text-muted-foreground"
                  >
                    {check}
                  </span>
                ))}
              </div>

              <Link
                href={item.ctaHref}
                className="mt-5 flex w-full items-center justify-between rounded-lg border border-foreground/5 bg-foreground/[0.02] px-4 py-2.5 text-sm text-muted-foreground transition-all hover:border-teal-500/25 hover:bg-foreground/[0.04] hover:text-foreground"
              >
                {item.ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}