import type { Metadata } from 'next';
import { StaticPage } from '@/components/pages/static-page';

export const metadata: Metadata = {
  title: 'Explore',
  description:
    'Explore Turf DRS for turf cricket: camera feeds, instant replays, ball tracking, and decision reviews for lbw, run outs, stumpings and boundaries.',
  alternates: { canonical: '/explore' },
};

const sections = [
  {
    title: 'Explore every DRS decision',
    body: 'Turf DRS brings broadcast-style review to turf cricket. Every decision can be checked with clean camera feeds and frame-accurate replay.',
    items: [
      { title: 'Live match control', body: 'Run a demo match end-to-end with live capture and review triggers.', href: '/live' },
      { title: 'Ball tracking', body: 'Top-down trajectory with impact point and projected wicket line.', href: '/live?demo=1' },
      { title: 'LBW review', body: 'Pitching in line, height at impact, and hitting vs missing — with a clear OUT or NOT OUT.', href: '/review?type=lbw&from=demo' },
      { title: 'Run out review', body: 'Crease and bails timed frame-by-frame at both ends.', href: '/review?type=runout&from=demo' },
      { title: 'Stumping review', body: 'Keeper gather timed against the batter grounding the bat.', href: '/review?type=stumping&from=demo' },
      { title: 'Caught review', body: 'Contact frame checked against the audio spike from the boundary mics.', href: '/review?type=caught&from=demo' },
      { title: 'Boundary review', body: 'Rope contact checked from the rope-level camera.', href: '/review?type=boundary&from=demo' },
    ],
  },
  {
    title: 'How replay works',
    body: 'Open any review, play the delivery, then switch between the umpire cam and the top-down camera. Slow motion and frame stepping line up every event.',
    items: [
      { title: 'Umpire cam', body: 'The end-goal feed that lines up the ball against the stumps.', href: '/review?type=lbw&from=demo' },
      { title: 'Top cam', body: 'The ball tracking view for pitching and wicket projection.', href: '/review?type=lbw&from=demo' },
      { title: 'Frame stepping', body: 'Step frame-by-frame forward and back to time contact and grounding.', href: '/review?from=demo' },
      { title: 'Slow motion', body: 'Slow-motion playback kicks in automatically as the ball reaches the batter.', href: '/live?demo=1' },
      { title: 'Camera setup', body: 'Where to place the end camera and the overhead camera on a turf pitch.', href: '/cameras' },
      { title: 'Review history', body: 'Every completed review, saved with its decision and timestamped frames.', href: '/reviews' },
    ],
  },
];

export default function ExplorePage() {
  return (
    <StaticPage
      eyebrow="Explore"
      title="Discover Turf DRS"
      highlight="for every cricket decision"
      description="Explore instant replays, ball tracking, and decision reviews — built for turf cricket and ready at the press of review."
      sections={sections}
    />
  );
}