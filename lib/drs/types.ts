export type ReviewTypeId = 'lbw' | 'caught' | 'runout' | 'stumping' | 'boundary';

export type Decision = 'OUT' | 'NOT OUT' | 'INCONCLUSIVE';

export type ReviewStatus = 'UPHELD' | 'OVERTURNED' | 'INCONCLUSIVE';

export type CameraPosition = 'umpire-end' | 'square-leg' | 'behind-wicket';

export type SignalStrength = 'good' | 'fair' | 'strong';

export type Camera = {
  id: string;
  name: string;
  position: CameraPosition;
  resolution: string;
  fps: number;
  signal: SignalStrength;
  recording: boolean;
  primary: boolean;
};

export type PlayerRole = 'batter' | 'bowler' | 'keeper' | 'all-rounder';

export type Player = {
  id: string;
  name: string;
  role: PlayerRole;
  teamId: string;
};

export type Team = {
  id: string;
  name: string;
  short: string;
  color: string;
};

export type Venue = {
  id: string;
  name: string;
  city: string;
  surface: 'turf' | 'grass' | 'astro';
};

export type Innings = {
  teamId: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number;
  target?: number;
};

export type Match = {
  id: string;
  tournament: string;
  venue: Venue;
  format: 'T20' | 'T10' | 'ODI' | 'Test' | 'Custom';
  oversPerInnings: number;
  teams: [Team, Team];
  players: Player[];
  battingFirstId: string;
  innings: Innings[];
  status: 'setup' | 'live' | 'finished';
};

export type DeliveryKind = 'dot' | 'runs' | 'wicket' | 'review' | 'boundary' | 'edge';

export type Delivery = {
  id: string;
  over: number;
  ball: number;
  result: string;
  runs: number;
  kind: DeliveryKind;
  reviewType?: ReviewTypeId;
  description: string;
};

export type FindingTone = 'good' | 'warn' | 'bad' | 'muted';

export type Finding = {
  id: string;
  label: string;
  value: string;
  tone: FindingTone;
};

export type AudioAnalysis = {
  sampleRate: number;
  durationMs: number;
  peakAtMs: number;
  peakDb: number;
  contactConfirmed: boolean;
};

export type TrajectoryPoint = { x: number; y: number };

export type ReviewEvidence = {
  matchId: string;
  ballId: string;
  type: ReviewTypeId;
  cameras: Camera[];
  findings: Finding[];
  impact?: TrajectoryPoint;
  trajectory?: TrajectoryPoint[];
  audio?: AudioAnalysis;
  hitStumps: boolean;
  batShortOfCrease: number | null;
  contactFrame: number | null;
  contactConfirmed: boolean;
};

export type Review = {
  id: string;
  matchId: string;
  matchLabel: string;
  ballId: string;
  type: ReviewTypeId;
  onField: Decision | 'SIX';
  decision: Decision;
  status: ReviewStatus;
  reason: string;
  createdAt: number;
  /** Signed-in user details captured at review time (demo runs signed-out = absent). */
  userEmail?: string;
  userName?: string;
};

export type DemoFlowStep = 'live' | 'review-triggered' | 'decision';

export type DrsConnector = {
  id: string;
  name: string;
  description: string;
  role: 'capture' | 'vision' | 'audio' | 'triggers';
  status: 'connected' | 'simulated';
};