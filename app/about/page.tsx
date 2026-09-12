import type { Metadata } from 'next';
import { Sparkles } from 'lucide-react';
import { StaticPage } from '@/components/pages/static-page';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Turf DRS brings professional decision review to local cricket — LBW, run out, stumping and boundary reviews for turf matches, academies and clubs.',
  alternates: { canonical: '/about' },
};

const sections = [
  {
    title: 'Our mission',
    body: 'Close calls change games. Turf DRS gives local matches, turf grounds, academies and clubs the same slow-motion replays, ball tracking and frame-by-frame reviews that used to be reserved for broadcast cricket — so the right decision wins, every time.',
  },
  {
    title: 'What we believe',
    items: [
      { title: 'Reviews should be fast', body: 'A review runs in under 30 seconds. The game keeps moving while the third umpire settles it on clear, replayable evidence.' },
      { title: 'Every decision counts', body: 'LBW, run out, stumping, boundary, edge, caught behind — the same call types professional cricket reviews, available on any turf.' },
      { title: 'No broadcast budget needed', body: 'Any phone or camera at the umpire end works. Turf DRS handles auto-capture and slow-mo without expensive equipment.' },
      { title: 'Open and honest', body: 'Turf DRS is an original, independent product — not affiliated with the ICC, IPL or Hawk-Eye — built for grassroots and academy cricket.' },
    ],
  },
  {
    title: 'Built with Turf DRS',
    body: `${siteConfig.name} is a Next.js application with an in-browser 3D replay engine, live ball tracking, and a review workstation served from the edge.`,
  },
];

export default function AboutPage() {
  return (
    <StaticPage
      eyebrow="About"
      title="The local third umpire for"
      highlight="every turf match"
      description={`${siteConfig.name} is a professional-style decision review system for local cricket — capture the delivery, settle the close call, and keep the game fair.`}
      sections={sections}
    />
  );
}