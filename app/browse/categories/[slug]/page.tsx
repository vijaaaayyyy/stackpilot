import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Check, ListChecks } from 'lucide-react';
import { DRS_REVIEW_TYPES, getAllReviewTypes, getReviewTypeBySlug } from '@/lib/drs/browse';
import { siteConfig, absoluteUrl } from '@/lib/site';

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return getAllReviewTypes().map((item) => ({ slug: item.slug }));
}

export function generateMetadata({ params }: Props): Metadata {
  const item = getReviewTypeBySlug(params.slug);
  if (!item) return {};
  const canonical = `/browse/categories/${item.slug}`;
  return {
    title: item.name,
    description: item.summary,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      url: absoluteUrl(canonical),
      title: item.name,
      description: item.summary,
      siteName: siteConfig.openGraph.siteName,
      locale: siteConfig.openGraph.locale,
      images: [{ url: absoluteUrl('/og.png'), width: 1200, height: 630, alt: siteConfig.name }],
    },
  };
}

export default function ReviewTypePage({ params }: Props) {
  const item = getReviewTypeBySlug(params.slug);
  if (!item) notFound();

  const Icon = item.icon;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <Link
        href="/browse/categories"
        className="text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        ← Back to review types
      </Link>

      <div className="rounded-2xl glass p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 ring-1 ring-teal-500/20">
            <Icon className="h-7 w-7 text-teal-300" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{item.name}</h1>
            <p className="mt-1 text-[11px] font-mono uppercase tracking-widest text-white/40">
              {item.short}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{item.summary}</p>
      </div>

      <section className="rounded-2xl glass p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <ListChecks className="h-4 w-4 text-teal-300" />
          What it checks
        </h2>
        <ul className="mt-4 space-y-3">
          {item.checks.map((check) => (
            <li key={check} className="flex items-start gap-3 text-sm text-muted-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
              {check}
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl glass p-6">
        <h2 className="text-sm font-semibold text-foreground">Run it in three steps</h2>
        <ol className="mt-4 space-y-3">
          {item.steps.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-teal-500/25 bg-teal-500/10 font-mono text-[11px] text-teal-300">
                {index + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </section>

      <Link
        href={item.ctaHref}
        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-teal-500/25 bg-teal-500/10 px-4 py-3 text-sm font-medium text-teal-200 transition-colors hover:bg-teal-500/20"
      >
        {item.ctaLabel}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <Link
        href="/browse/providers"
        className="block text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Browse Turf DRS venues →
      </Link>
    </div>
  );
}