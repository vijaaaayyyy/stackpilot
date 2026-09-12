import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  Camera,
  FileText,
  HelpCircle,
  ListChecks,
  MapPin,
  PlayCircle,
  Sparkles,
} from 'lucide-react';
import { siteConfig } from '@/lib/site';
import { DRS_REVIEW_TYPES } from '@/lib/drs/browse';
import { breadcrumbSchema, serializeJsonLd } from '@/lib/jsonld';

export const metadata: Metadata = {
  title: 'Documentation',
  description:
    'Learn how to use Turf DRS: set up the end camera, run LBW, run out and caught behind reviews, use ball tracking, and manage matches on your turf.',
  alternates: {
    canonical: '/docs',
  },
  openGraph: {
    type: 'website',
    title: `Documentation — ${siteConfig.name}`,
    description:
      'Learn how to set up Turf DRS, run decision reviews, and manage matches on your turf.',
  },
};

const quickStartCode = `# 1. Open the live demo match
# 2. Point the end camera at the stumps
# 3. Run an LBW or run out review
# 4. Settle the call with slow-mo + ball tracking`;

export default function DocsPage() {
  const jsonLd = breadcrumbSchema([{ name: 'Docs', url: '/docs' }]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <p className="text-sm font-medium text-teal-400">Documentation</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Settle it right with <span className="gradient-text">Turf DRS</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            Everything you need to run decision reviews, set up cameras, and manage matches on
            your turf, at your academy, or in your league.
          </p>
        </header>

        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <PlayCircle className="h-4 w-4 text-teal-400" />
            Quick start
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Go from zero to a settled review in under a minute on the live demo match. No account,
            no setup, no credit card.
          </p>
          <div className="mt-4 overflow-hidden rounded-xl border border-foreground/5 bg-foreground/[0.03] p-5 font-mono text-[13px] leading-relaxed text-foreground/80">
            {quickStartCode}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <ListChecks className="h-4 w-4 text-teal-400" />
            Review types
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Every decision Turf DRS can settle — pick one to see the evidence chain and how the
            demo runs.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {DRS_REVIEW_TYPES.map((item) => (
              <Link
                key={item.slug}
                href={`/browse/categories/${item.slug}`}
                className="group flex items-start gap-3 rounded-2xl glass p-4 transition-all hover:-translate-y-0.5"
              >
                <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                <span>
                  <span className="block text-sm font-semibold text-foreground group-hover:text-teal-400">
                    {item.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">{item.short}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Camera className="h-4 w-4 text-teal-400" />
            Camera setup
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/cameras"
              className="group flex items-start gap-3 rounded-2xl glass p-4 transition-all hover:-translate-y-0.5"
            >
              <Camera className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
              <span>
                <span className="block text-sm font-semibold text-foreground group-hover:text-teal-400">
                  The camera rig
                </span>
                <span className="block text-xs text-muted-foreground">
                  End camera, top camera and the third angle
                </span>
              </span>
            </Link>
            <Link
              href="/browse/categories/cameras"
              className="group flex items-start gap-3 rounded-2xl glass p-4 transition-all hover:-translate-y-0.5"
            >
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
              <span>
                <span className="block text-sm font-semibold text-foreground group-hover:text-teal-400">
                  Camera review type
                </span>
                <span className="block text-xs text-muted-foreground">
                  Calibration steps for a two-camera rig
                </span>
              </span>
            </Link>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-4 w-4 text-teal-400" />
            Venues
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Turf grounds, net facilities and club ovals set up to run Turf DRS — from permanent
            rigs to a portable end camera.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { title: 'Browse venues', description: 'See the grounds on Turf DRS', href: '/browse/providers' },
              { title: 'Featured: Serenity Turf Arena', description: 'Open turf, end + top rig', href: '/browse/providers/serenity-turf' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group flex items-start gap-3 rounded-2xl glass p-4 transition-all hover:-translate-y-0.5"
              >
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                <span>
                  <span className="block text-sm font-semibold text-foreground group-hover:text-teal-400">
                    {link.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">{link.description}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-3 sm:grid-cols-2">
          <Link
            href="/changelog"
            className="flex items-center justify-between rounded-2xl glass p-5 transition-all hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-teal-400" />
              <span>
                <span className="block text-sm font-semibold text-foreground">Changelog</span>
                <span className="block text-xs text-muted-foreground">See what&apos;s new</span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            href="/faq"
            className="flex items-center justify-between rounded-2xl glass p-5 transition-all hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-3">
              <HelpCircle className="h-5 w-5 text-teal-400" />
              <span>
                <span className="block text-sm font-semibold text-foreground">FAQ</span>
                <span className="block text-xs text-muted-foreground">Frequently asked questions</span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>
      </div>
    </>
  );
}