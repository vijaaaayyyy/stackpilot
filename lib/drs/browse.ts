import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownLeft,
  Camera,
  Clock,
  Eye,
  Flag,
  Hand,
  MoveUpRight,
} from 'lucide-react';

export type DrsReviewType = {
  slug: string;
  name: string;
  short: string;
  summary: string;
  checks: string[];
  steps: string[];
  ctaHref: string;
  ctaLabel: string;
  icon: LucideIcon;
};

export const DRS_REVIEW_TYPES: DrsReviewType[] = [
  {
    slug: 'lbw',
    name: 'LBW Review',
    short: 'Pitching, impact and wicket line',
    summary:
      'Pitching in line, height at impact and a projected wicket line — with a clear OUT or NOT OUT.',
    checks: ['Pitching in line', 'Impact below the bails', 'Projected to hit stumps'],
    steps: ['Play the delivery from the umpire cam', 'Switch to the top cam for the pitch map', 'Confirm OUT or NOT OUT'],
    ctaHref: '/review?type=lbw&from=demo',
    ctaLabel: 'Run demo LBW review',
    icon: MoveUpRight,
  },
  {
    slug: 'runout',
    name: 'Run Out Review',
    short: 'Crease and bails, frame by frame',
    summary:
      'Bails and crease are timed frame-by-frame at both ends to see when the grounding happened.',
    checks: ['Bails dislodged frame', 'Grounding frame at the crease'],
    steps: ['Step to the bails-off frame', 'Step to the grounding frame', 'Compare the two on screen'],
    ctaHref: '/review?type=runout&from=demo',
    ctaLabel: 'Run demo run out review',
    icon: Flag,
  },
  {
    slug: 'stumping',
    name: 'Stumping Review',
    short: 'Keeper gather vs bat grounding',
    summary:
      'The keeper gather is timed against the batter grounding the bat — behind the line or not.',
    checks: ['Gather + strike frame', 'Batter grounding frame'],
    steps: ['Find the gather frame', 'Find the grounding frame', 'Decide behind the line'],
    ctaHref: '/review?type=stumping&from=demo',
    ctaLabel: 'Run demo stumping review',
    icon: Hand,
  },
  {
    slug: 'caught',
    name: 'Caught Behind',
    short: 'Contact checked against the audio spike',
    summary:
      'The contact frame is matched to the audio spike from the boundary mics and settled cleanly.',
    checks: ['Audio spike', 'Contact frame'],
    steps: ['Play the delivery with sound on', 'Freeze at the spike', 'Confirm the catch'],
    ctaHref: '/review?type=caught&from=demo',
    ctaLabel: 'Run demo caught review',
    icon: Eye,
  },
  {
    slug: 'boundary',
    name: 'Boundary Review',
    short: 'Rope contact from the rope camera',
    summary:
      'The rope-level camera shows exactly where and when the ball crossed the boundary rope.',
    checks: ['Rope contact', 'Grounding of the fielder'],
    steps: ['Watch from the rope camera', 'Freeze at first contact', 'Say six, four or not out'],
    ctaHref: '/review?type=boundary&from=demo',
    ctaLabel: 'Run demo boundary review',
    icon: ArrowDownLeft,
  },
  {
    slug: 'ball-tracking',
    name: 'Ball Tracking',
    short: 'Trajectory, impact and projection',
    summary:
      'A clean top-down trajectory with the impact marker and a projected path to the stumps.',
    checks: ['Impact marker', 'Projected wicket line'],
    steps: ['Play the delivery', 'Watch the impact light up', 'Read the projected line'],
    ctaHref: '/live?demo=1',
    ctaLabel: 'Watch live ball tracking',
    icon: MoveUpRight,
  },
  {
    slug: 'replay',
    name: 'Instant Replay',
    short: 'Slow motion and frame stepping',
    summary:
      'Every replayed delivery runs at broadcast speed, then drops into slow motion at the business end.',
    checks: ['Slow-motion knee', 'Frame-by-frame stepping'],
    steps: ['Play the delivery', 'Scrub to any moment', 'Step frame by frame'],
    ctaHref: '/review?from=demo',
    ctaLabel: 'Open the replay desk',
    icon: Clock,
  },
  {
    slug: 'cameras',
    name: 'Camera Setup',
    short: 'End camera and top camera rigs',
    summary:
      'A two-camera rig — end-on for stumps and lines, overhead for the pitch map — made for turf pitches.',
    checks: ['End camera (umpire cam)', 'Overhead camera (top cam)'],
    steps: ['Mount the end camera', 'Mount the top camera', 'Calibrate once per ground'],
    ctaHref: '/cameras',
    ctaLabel: 'See camera setup',
    icon: Camera,
  },
];

export type DrsVenue = {
  slug: string;
  name: string;
  city: string;
  type: string;
  strips: number;
  surface: string;
  rig: string;
  features: string[];
  summary: string;
  highlights: string[];
};

export const DRS_VENUES: DrsVenue[] = [
  {
    slug: 'serenity-turf',
    name: 'Serenity Turf Arena',
    city: 'Hyderabad',
    type: 'Open turf',
    strips: 4,
    surface: 'Coir blade turf',
    rig: 'End + top camera rig',
    features: ['Floodlit night play', 'Practice nets', 'Sight screens'],
    summary: 'An open turf with a permanent end and top camera rig, ready for evening fixtures.',
    highlights: ['End camera behind the bowler', 'Overhead top camera on the gantry', 'Live capture works every match'],
  },
  {
    slug: 'dawn-cricket-academy',
    name: 'Dawn Cricket Academy',
    city: 'Pune',
    type: 'Covered nets',
    strips: 6,
    surface: 'Astroturf lanes',
    rig: 'End cam per lane',
    features: ['6 bowling lanes', 'Bowlers run-in area', 'Data-led practice'],
    summary: 'Covered net facility where every lane can run a review from its own end camera.',
    highlights: ['Per-lane end cameras', 'Instant replay for drills', 'Coach-approved'],
  },
  {
    slug: 'greenfield-turf',
    name: 'Greenfield Turf',
    city: 'Bengaluru',
    type: 'Open turf',
    strips: 5,
    surface: 'Coir blade turf',
    rig: 'End + top camera rig',
    features: ['5 match strips', 'Corporate & league play', 'Changing rooms'],
    summary: 'Five match-ready strips under a solid end and top rig for league evenings.',
    highlights: ['League match scoring', 'Full evening floodlights', 'Turf DRS ready'],
  },
  {
    slug: 'nis-oval',
    name: 'NIS Oval Ground',
    city: 'Chennai',
    type: 'Open ground',
    strips: 3,
    surface: 'Grass matting on turf',
    rig: 'Portable end cam',
    features: ['3 center strips', 'Outfield practice', 'Weekend matches'],
    summary: 'A no-nonsense oval that packs a portable end camera for match reviews.',
    highlights: ['Portable rig in 15 minutes', 'Works for day matches', 'Popular for weekend leagues'],
  },
  {
    slug: 'skyhigh-sports',
    name: 'SkyHigh Sports',
    city: 'Gurugram',
    type: 'Indoor turf',
    strips: 2,
    surface: 'Indoor synthetic turf',
    rig: 'End + top camera rig',
    features: ['Indoor play all weather', 'Air-conditioned', 'Evening leagues'],
    summary: 'Indoor turf with controlled light, making the end rig and top cam rock solid.',
    highlights: ['Weather-proof play', 'Controlled lighting', '2 review-ready strips'],
  },
  {
    slug: 'riverside-cricket',
    name: 'Riverside Cricket Club',
    city: 'Kochi',
    type: 'Open turf',
    strips: 4,
    surface: 'Coir blade turf',
    rig: 'End cam',
    features: ['Riverside grounds', '4 strips', 'Club members cricket'],
    summary: 'A club ground with an end camera that keeps close decisions honest.',
    highlights: ['End-on reviews', 'Club night fixtures', 'Back-to-back matches'],
  },
];

export function getAllReviewTypes(): DrsReviewType[] {
  return DRS_REVIEW_TYPES;
}

export function getReviewTypeBySlug(slug: string): DrsReviewType | undefined {
  return DRS_REVIEW_TYPES.find((item) => item.slug === slug);
}

export function getAllVenues(): DrsVenue[] {
  return DRS_VENUES;
}

export function getVenueBySlug(slug: string): DrsVenue | undefined {
  return DRS_VENUES.find((item) => item.slug === slug);
}