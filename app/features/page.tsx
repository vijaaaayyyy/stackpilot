import type { Metadata } from 'next';
import { StaticPage } from '@/components/pages/static-page';

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Turf DRS features: live match capture, instant replays, ball tracking and decision reviews for turf cricket.',
  alternates: { canonical: '/features' },
};

const sections = [
  {
    title: 'Core features',
    body: 'Turf DRS turns your turf pitch into a review-ready ground — capture, replay and decide in seconds.',
    items: [
      { title: 'Live match control', body: 'Run a match end-to-end with live capture and a review button for every decision.', href: '/live' },
      { title: 'Instant replay', body: 'Every delivery replayed cleanly, with slow motion kicking in at the business end.', href: '/review?from=demo' },
      { title: 'Frame-by-frame analysis', body: 'Step frame by frame to time bails, creases, keepers and bat grounding.', href: '/review?type=runout&from=demo' },
      { title: 'Ball tracking', body: 'Top-down trajectory with impact marker and projected wicket line.', href: '/browse/categories/ball-tracking' },
      { title: 'Decision reviews', body: 'LBW, run out, stumping, caught behind and boundary reviews with clear OUT or NOT OUT.', href: '/browse/categories' },
      { title: 'Review history', body: 'Every completed review is saved with its decision and timestamped frames.', href: '/reviews' },
    ],
  },
  {
    title: 'Covered decisions',
    body: 'Built for the calls that matter on turf.',
    items: [
      { title: 'LBW Review', body: 'Pitching in line, height at impact and the projected wicket line.', href: '/browse/categories/lbw' },
      { title: 'Run Out Review', body: 'Crease and bails timed frame-by-frame at both ends.', href: '/browse/categories/runout' },
      { title: 'Stumping Review', body: 'Keeper gather timed against the grounding of the bat.', href: '/browse/categories/stumping' },
      { title: 'Caught Behind', body: 'Contact frame matched to the audio spike from the boundary mics.', href: '/browse/categories/caught' },
      { title: 'Boundary Review', body: 'Rope contact from the rope-level camera.', href: '/browse/categories/boundary' },
      { title: 'Camera Setup', body: 'A two-camera rig — end-on and overhead — made for turf pitches.', href: '/browse/categories/cameras' },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <StaticPage
      eyebrow="Features"
      title="Everything you need to"
      highlight="review on turf"
      description="Live capture, instant replays, ball tracking and clear decision reviews — built for turf cricket and ready at the press of review."
      sections={sections}
    />
  );
}