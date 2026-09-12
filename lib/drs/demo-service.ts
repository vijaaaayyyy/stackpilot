import type {
  Camera,
  Decision,
  Delivery,
  Finding,
  Match,
  Review,
  ReviewEvidence,
  ReviewTypeId,
  TrajectoryPoint,
} from './types';
import { makeCached, type DrsService } from './service';

const VENUE = { id: 'htl-1', name: 'Hyderabad Turf Arena', city: 'Hyderabad', surface: 'turf' as const };

const TEAMS = {
  home: { id: 'falcons', name: 'Falcons', short: 'FAL', color: '#0ea5a0' },
  away: { id: 'strikers', name: 'Strikers', short: 'STR', color: '#f59e0b' },
};

const PLAYERS = [
  { id: 'p1', name: 'Rohit Sharma', role: 'batter' as const, teamId: 'falcons' },
  { id: 'p2', name: 'Virat Kohli', role: 'batter' as const, teamId: 'falcons' },
  { id: 'p3', name: 'Rashid Khan', role: 'all-rounder' as const, teamId: 'falcons' },
  { id: 'p4', name: 'Pat Cummins', role: 'bowler' as const, teamId: 'falcons' },
  { id: 'p5', name: 'Andre Russell', role: 'all-rounder' as const, teamId: 'strikers' },
  { id: 'p6', name: 'Jasprit Bumrah', role: 'bowler' as const, teamId: 'strikers' },
  { id: 'p7', name: 'Kane Williamson', role: 'batter' as const, teamId: 'strikers' },
  { id: 'p8', name: 'Mitchell Starc', role: 'bowler' as const, teamId: 'strikers' },
];

export const DEMO_MATCH: Match = {
  id: 'demo-live',
  tournament: 'Hyderabad Turf League',
  venue: VENUE,
  format: 'T20',
  oversPerInnings: 20,
  teams: [TEAMS.home, TEAMS.away],
  players: PLAYERS,
  battingFirstId: 'falcons',
  innings: [
    { teamId: 'falcons', runs: 142, wickets: 5, overs: 16, balls: 4, target: 143 },
    { teamId: 'strikers', runs: 0, wickets: 0, overs: 0, balls: 0 },
  ],
  status: 'live',
};

export const DEMO_DELIVERIES: Delivery[] = [
  { id: '16.1', over: 16, ball: 1, result: 'DOT', runs: 0, kind: 'dot', description: 'Good length, beat the outside edge.' },
  { id: '16.2', over: 16, ball: 2, result: '1 RUN', runs: 1, kind: 'runs', description: 'Driven through the off side, one taken.' },
  { id: '16.3', over: 16, ball: 3, result: '2 RUNS', runs: 2, kind: 'runs', description: 'Flicked wide of mid-wicket, quick two.' },
  { id: '16.4', over: 16, ball: 4, result: 'REVIEW', runs: 0, kind: 'review', reviewType: 'lbw', description: 'Struck on the pad — LBW appeal signalled.' },
];

export const DEMO_CAMERAS: Camera[] = [
  { id: 'cam-01', name: 'CAM 01', position: 'umpire-end', resolution: '1080p', fps: 60, signal: 'good', recording: true, primary: true },
  { id: 'cam-02', name: 'CAM 02', position: 'square-leg', resolution: '1080p', fps: 60, signal: 'fair', recording: true, primary: false },
  { id: 'cam-03', name: 'CAM 03', position: 'behind-wicket', resolution: '720p', fps: 120, signal: 'good', recording: true, primary: false },
];

const TRAJECTORY: TrajectoryPoint[] = [
  { x: 298, y: 84 },
  { x: 296, y: 118 },
  { x: 302, y: 168 },
  { x: 312, y: 206 },
  { x: 318, y: 150 },
  { x: 326, y: 126 },
];

const FINDINGS_BY_TYPE: Record<ReviewTypeId, Finding[]> = {
  lbw: [
    { id: 'impact', label: 'Pitch impact', value: 'IN LINE', tone: 'good' },
    { id: 'height', label: 'Height at impact', value: 'BELOW BAILS', tone: 'good' },
    { id: 'path', label: 'Projected path', value: 'HITTING STUMPS', tone: 'good' },
  ],
  caught: [
    { id: 'contact', label: 'Bat contact', value: 'POSSIBLE CONTACT', tone: 'warn' },
    { id: 'audio', label: 'Audio spike', value: 'CONFIRMED', tone: 'good' },
    { id: 'frame', label: 'Contact frame', value: 'FRAME 241', tone: 'good' },
  ],
  runout: [
    { id: 'bail', label: 'Bails broken', value: 'FRAME 258', tone: 'good' },
    { id: 'bat', label: 'Bat grounded', value: 'FRAME 263', tone: 'warn' },
    { id: 'gap', label: 'Bat short', value: '36 CM', tone: 'bad' },
  ],
  stumping: [
    { id: 'gather', label: 'Keeper gather', value: 'FRAME 243', tone: 'good' },
    { id: 'bails', label: 'Bails dislodged', value: 'FRAME 246', tone: 'good' },
    { id: 'bat', label: 'Bat grounded', value: 'FRAME 249', tone: 'bad' },
  ],
  boundary: [
    { id: 'rope', label: 'Ball vs rope', value: 'CLEAR DAYLIGHT', tone: 'good' },
    { id: 'contact', label: 'Fielder contact', value: 'NONE AT ROPE', tone: 'good' },
    { id: 'clip', label: 'Rope frame', value: 'FRAME 274', tone: 'good' },
  ],
};

const REASONS: Record<ReviewTypeId, Record<Decision, string>> = {
  lbw: {
    OUT: 'Impact in line, below the bails, projected onto the stumps.',
    'NOT OUT': 'Impact outside the line or missing the stumps.',
    INCONCLUSIVE: 'Insufficient evidence to overturn the on-field call.',
  },
  caught: {
    OUT: 'Audio spike and frame overlay confirm edge contact.',
    'NOT OUT': 'No conclusive contact between bat and ball.',
    INCONCLUSIVE: 'Contact frame ambiguous across cameras.',
  },
  runout: {
    OUT: 'Bails broken before the bat was grounded inside the crease.',
    'NOT OUT': 'Bat grounded in time with the crease.',
    INCONCLUSIVE: 'Corridor frame unavailable.',
  },
  stumping: {
    OUT: 'Bat was out of ground when the bails were removed.',
    'NOT OUT': 'Bat grounded before the bails were dislodged.',
    INCONCLUSIVE: 'Keeper gather frame incomplete.',
  },
  boundary: {
    OUT: 'Fielder contact with the rope ruled it a not the boundary.',
    'NOT OUT': 'Clean boundary — ball clear of the fielder at the rope.',
    INCONCLUSIVE: 'Rope camera angle obstructed.',
  },
};

const ON_FIELD: Record<ReviewTypeId, Decision | 'SIX'> = {
  lbw: 'NOT OUT',
  caught: 'NOT OUT',
  runout: 'NOT OUT',
  stumping: 'OUT',
  boundary: 'SIX',
};

export class DemoDrsService implements DrsService {
  private readonly match: Match;
  private readonly deliveries: Delivery[];
  private readonly cameras: Camera[];

  constructor(match: Match = DEMO_MATCH, deliveries: Delivery[] = DEMO_DELIVERIES, cameras: Camera[] = DEMO_CAMERAS) {
    this.match = match;
    this.deliveries = deliveries;
    this.cameras = cameras;
  }

  async getMatch(matchId = 'demo-live'): Promise<Match> {
    await delay(120);
    return this.match;
  }

  async getDeliveries(): Promise<Delivery[]> {
    await delay(60);
    return this.deliveries;
  }

  async getCameras(): Promise<Camera[]> {
    await delay(60);
    return this.cameras;
  }

  async requestEvidence(input: { matchId: string; ballId: string; type: ReviewTypeId }): Promise<ReviewEvidence> {
    await delay(900);
    const audioConfirmed = input.type === 'caught';
    const hitStumps = input.type !== 'boundary';
    return {
      matchId: input.matchId,
      ballId: input.ballId,
      type: input.type,
      cameras: this.cameras,
      findings: FINDINGS_BY_TYPE[input.type],
      trajectory: TRAJECTORY,
      impact: TRAJECTORY[4],
      audio: input.type === 'caught'
        ? { sampleRate: 48_000, durationMs: 1200, peakAtMs: 640, peakDb: -9.4, contactConfirmed: true }
        : undefined,
      hitStumps,
      batShortOfCrease: input.type === 'runout' ? 36 : input.type === 'stumping' ? 0 : null,
      contactFrame: input.type === 'caught' ? 241 : null,
      contactConfirmed: audioConfirmed,
    };
  }

  async finalizeReview(input: {
    matchId: string;
    ballId: string;
    type: ReviewTypeId;
    decision: Decision;
    onField: Decision | 'SIX';
  }): Promise<Review> {
    await delay(240);
    return {
      id: reviewId(),
      matchId: input.matchId,
      matchLabel: 'Falcons vs Strikers · HTL',
      ballId: input.ballId,
      type: input.type,
      onField: input.onField,
      decision: input.decision,
      status: deriveStatus(input.onField, input.decision),
      reason: REASONS[input.type][input.decision],
      createdAt: Date.now(),
    };
  }
}

export function deriveStatus(onField: Decision | 'SIX', decision: Decision): 'UPHELD' | 'OVERTURNED' | 'INCONCLUSIVE' {
  if (decision === 'INCONCLUSIVE') return 'INCONCLUSIVE';
  const onFieldOut = onField === 'OUT';
  const finalOut = decision === 'OUT';
  return onFieldOut === finalOut ? 'UPHELD' : 'OVERTURNED';
}

export function reasonFor(type: ReviewTypeId, decision: Decision): string {
  return REASONS[type][decision];
}

export function onFieldFor(type: ReviewTypeId): Decision | 'SIX' {
  return ON_FIELD[type];
}

function reviewId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `rv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Pre-built cached instances for components (avoids N separate caches). */
export const demoService = new DemoDrsService();
export const cachedMatch = makeCached(() => demoService.getMatch());
export const cachedDeliveries = makeCached(() => demoService.getDeliveries());
export const cachedCameras = makeCached(() => demoService.getCameras());