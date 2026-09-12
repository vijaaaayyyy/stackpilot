import type { Metadata } from 'next';
import { ArrowRight, CalendarDays, Clock } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Guides and insights on local cricket reviews: LBW and run out decisions, camera setup, ball tracking, and running a Turf DRS match.',
  alternates: { canonical: '/blog' },
};

const posts = [
  {
    title: 'Setting up the umpire-end camera',
    date: 'August 2026',
    readTime: '6 min',
    excerpt:
      'Wide, level, and showing both sets of stumps — a practical guide to the camera position behind the bowler.',
    href: '/cameras',
    tag: 'Setup',
  },
  {
    title: 'How an LBW review actually works',
    date: 'July 2026',
    readTime: '5 min',
    excerpt:
      'Pitching, impact and the projected wicket line — and how the third umpire reads the evidence on screen.',
    href: '/browse/categories/lbw',
    tag: 'Reviews',
  },
  {
    title: 'Run outs and crease timing, frame by frame',
    date: 'July 2026',
    readTime: '4 min',
    excerpt:
      'Bails off, grounding, and the frame-by-frame comparison that settles a run out beyond doubt.',
    href: '/browse/categories/runout',
    tag: 'Tutorial',
  },
  {
    title: 'Ball tracking vs. reality on local turfs',
    date: 'June 2026',
    readTime: '7 min',
    excerpt:
      'Balanced, clear, useful — how trajectory modelling fits grassroots grounds without pretending to be Hawk-Eye.',
    href: '/browse/categories/ball-tracking',
    tag: 'Ball tracking',
  },
  {
    title: 'Running a full match with reviews',
    date: 'May 2026',
    readTime: '5 min',
    excerpt:
      'Create the match, save the squads, capture every delivery, and settle the close ones — your weekend, reviewed.',
    href: '/live',
    tag: 'Matches',
  },
];

export default function BlogPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-teal-400">Blog</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Review the game, <span className="gradient-text">right</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Guides and insights on camera setup, review types, ball tracking, and running a
            Turf DRS match.
          </p>
        </header>

        <div className="mx-auto mt-16 max-w-3xl space-y-4">
          {posts.map((post) => (
            <a
              key={post.title}
              href={post.href}
              className="group block glass glass-hover rounded-2xl p-6 transition-all hover:-translate-y-1"
            >
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-full bg-teal-500/10 px-2.5 py-0.5 font-medium text-teal-400">
                  {post.tag}
                </span>
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {post.date}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {post.readTime}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-foreground transition-colors group-hover:text-teal-400">
                {post.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-400">
                Read guide <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}