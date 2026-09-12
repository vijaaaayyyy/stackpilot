import Link from 'next/link';
import { ArrowRight, BookOpen } from 'lucide-react';

const topics = [
  {
    slug: 'getting-started',
    title: 'Getting Started',
    description: 'Set your ground up for Turf DRS reviews in minutes.',
  },
  {
    slug: 'reviews',
    title: 'How Reviews Work',
    description: 'From on-field signal to final decision — the full review flow.',
  },
  {
    slug: 'camera-setup',
    title: 'Camera Setup',
    description: 'Best angles and positions for reliable, reviewable footage.',
  },
  {
    slug: 'ball-tracking',
    title: 'Ball Tracking',
    description: 'How trajectory and impact point are measured and visualised.',
  },
  {
    slug: 'lbw-reviews',
    title: 'LBW & Wicket Reviews',
    description: 'Reading impact, bounce, and ball path with confidence.',
  },
  {
    slug: 'academies-clubs',
    title: 'Academies & Clubs',
    description: 'Match days, nets sessions, and leagues for coaches and clubs.',
  },
];

export function DocsSection() {
  return (
    <section id="docs" className="relative py-24 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-teal-500/10 blur-[140px]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-teal-400">Documentation</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Guides for <span className="gradient-text">every decision</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Everything you need to set up, run, and master Turf DRS reviews on your turf.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {topics.map((topic) => (
            <Link
              key={topic.slug}
              href={`/docs/${topic.slug}`}
              className="group glass glass-hover rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10 ring-1 ring-teal-500/20">
                  <BookOpen className="h-5 w-5 text-teal-400" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-foreground group-hover:text-teal-400">
                {topic.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {topic.description}
              </p>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/docs"
            className="inline-flex items-center gap-2 rounded-full glass glass-hover px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:text-teal-400"
          >
            Browse all documentation
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}