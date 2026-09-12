import type { Metadata } from 'next';
import { CalendarDays, Check } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Changelog',
  description: 'Recent updates, improvements, and fixes to Turf DRS.',
  alternates: { canonical: '/changelog' },
};

const entries = [
  {
    version: '4.5.0',
    date: 'September 2026',
    items: [
      '3D replay scene with umpire and top camera views',
      'Turf DRS Explore and Browse pages',
      'New review types: LBW, run out, stumping, caught behind, boundary',
      'Venue guide with camera-ready grounds',
    ],
  },
  {
    version: '4.0.0',
    date: 'August 2026',
    items: [
      'Live ball tracking with trajectory projection',
      'Decision review workstation for the third umpire',
      'Squad and academy management',
      'Robots.txt and sitemap.xml for discoverability',
    ],
  },
  {
    version: '3.0.0',
    date: 'July 2026',
    items: [
      'Auto-capture for every delivery from the end camera',
      'Slow-motion and frame-by-frame replay',
      'In-browser 3D pitch map and impact markers',
    ],
  },
  {
    version: '2.0.0',
    date: 'May 2026',
    items: [
      'Run out and stumping reviews with crease timing',
      'Camera rig setup and calibration guide',
      'Match records for turf, academies and clubs',
    ],
  },
  {
    version: '1.0.0',
    date: 'April 2026',
    items: ['Initial release of Turf DRS', 'Core live demo with ball tracking'],
  },
];

export default function ChangelogPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-teal-400">Changelog</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            What&apos;s <span className="gradient-text">new</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Recent updates, improvements, and fixes to Turf DRS.
          </p>
        </header>

        <div className="mx-auto mt-16 max-w-2xl space-y-6">
          {entries.map((entry) => (
            <article key={entry.version} className="glass glass-hover rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-foreground">v{entry.version}</h2>
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {entry.date}
                </span>
              </div>
              <ul className="mt-4 space-y-2.5">
                {entry.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                      <Check className="h-2.5 w-2.5 text-emerald-400" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}