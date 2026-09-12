export type TurfActionId = 'demo' | 'live' | 'create-match' | 'cameras' | 'review';

export type TurfHelpAction = {
  label: string;
  action?: TurfActionId;
  href?: string;
};

export type TurfCommand =
  | { kind: 'action'; id: TurfActionId; label: string; href: string }
  | { kind: 'help'; question: string; answer: string; actions: TurfHelpAction[] };

const ACTION_PATHS: Record<TurfActionId, string> = {
  demo: '/live?demo=1',
  live: '/live',
  'create-match': '/create-match',
  cameras: '/cameras',
  review: '/review',
};

export function actionHref(id: TurfActionId): string {
  return ACTION_PATHS[id];
}

const QUESTION_STARTS = [
  'how',
  'what',
  'why',
  'when',
  'where',
  'which',
  'can',
  'does',
  'do',
  'is',
  'are',
  'should',
  'will',
  'would',
  'help',
  'explain',
  'tell',
  'show me',
];

function isQuestion(normalized: string): boolean {
  if (normalized.endsWith('?')) return true;
  return QUESTION_STARTS.some((word) => normalized === word || normalized.startsWith(`${word} `));
}

type HelpTopic = {
  answer: string;
  actions: TurfHelpAction[];
};

const HELP_TOPICS: Record<string, HelpTopic> = {
  reviewFlow: {
    answer:
      'Reviews are simple. Place a camera at the umpire end, and Turf DRS auto-captures every delivery. When the on-field umpire signals for a review, slow-mo, frame-by-frame, and ball tracking settle it — usually in under 30 seconds.',
    actions: [
      { label: 'Start Demo Match', action: 'demo' },
      { label: 'Open Live Match', action: 'live' },
    ],
  },
  cameras: {
    answer:
      'Any phone or camera works. Set it up at the umpire end with a level, wide view of the pitch and stumps, then Turf DRS handles auto-capture for every delivery.',
    actions: [
      { label: 'Go to Camera Setup', action: 'cameras' },
      { label: 'Start Demo Match', action: 'demo' },
    ],
  },
  createMatch: {
    answer:
      'Creating a match takes a few taps — pick your teams, format, overs, and venue. Turf DRS starts capturing from the very first ball.',
    actions: [
      { label: 'Create a Match', action: 'create-match' },
      { label: 'Start Demo Match', action: 'demo' },
    ],
  },
  lbw: {
    answer:
      'LBW reviews use high-speed footage plus ball tracking to show the exact impact point and where the ball was going. If it was missing the stumps, it stays not out.',
    actions: [
      { label: 'Open Live Match', action: 'live' },
      { label: 'Start Demo Match', action: 'demo' },
    ],
  },
  pricing: {
    answer:
      'Turf DRS is free to get started on your turf. A camera at the umpire end, auto-capture, and unlimited local reviews — no credit card needed.',
    actions: [
      { label: 'View Pricing', href: '/pricing' },
      { label: 'Start Demo Match', action: 'demo' },
    ],
  },
  generic: {
    answer:
      'Turf DRS brings professional-style cricket reviews to local matches, turf cricket, academies, and clubs. Set up a camera, auto-capture every delivery, and settle close calls with slow-mo and ball tracking.',
    actions: [
      { label: 'Start Demo Match', action: 'demo' },
      { label: 'Open Live Match', action: 'live' },
    ],
  },
};

function detectHelpTopic(normalized: string): HelpTopic {
  if (/review|drs|third.?umpire|work|decision/.test(normalized)) return HELP_TOPICS.reviewFlow;
  if (/camera|cameras|setup|record/.test(normalized)) return HELP_TOPICS.cameras;
  if (/lbw|leg.?before/.test(normalized)) return HELP_TOPICS.lbw;
  if (/create|new|add|start.*match/.test(normalized) && /match/.test(normalized)) {
    return HELP_TOPICS.createMatch;
  }
  if (/pricing|price|cost|free|pay/.test(normalized)) return HELP_TOPICS.pricing;
  return HELP_TOPICS.generic;
}

const REVIEW_TYPE_PATTERNS: { pattern: RegExp; type: string; label: string }[] = [
  { pattern: /\blbw\b|leg.?before/, type: 'lbw', label: 'LBW Review' },
  { pattern: /run.?out/, type: 'run-out', label: 'Run Out Review' },
  { pattern: /stump/, type: 'stumping', label: 'Stumping Review' },
  { pattern: /boundary|rope/, type: 'boundary', label: 'Boundary Review' },
];

export function resolveTurfQuery(raw: string): TurfCommand {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, ' ');

  if (!normalized) {
    return {
      kind: 'help',
      question: 'How does a review work?',
      answer: HELP_TOPICS.generic.answer,
      actions: HELP_TOPICS.generic.actions,
    };
  }

  if (isQuestion(normalized)) {
    const topic = detectHelpTopic(normalized);
    return { kind: 'help', question: raw, answer: topic.answer, actions: topic.actions };
  }

  if (/demo/.test(normalized)) {
    return { kind: 'action', id: 'demo', label: 'Start Demo', href: actionHref('demo') };
  }
  if (/live/.test(normalized)) {
    return { kind: 'action', id: 'live', label: 'Live Match', href: actionHref('live') };
  }
  if (/camera|cameras/.test(normalized) || /setup|record/.test(normalized)) {
    return { kind: 'action', id: 'cameras', label: 'Cameras', href: actionHref('cameras') };
  }
  if (/match/.test(normalized) && /create|new|add|start/.test(normalized)) {
    return { kind: 'action', id: 'create-match', label: 'Create Match', href: actionHref('create-match') };
  }

  const reviewMatch = REVIEW_TYPE_PATTERNS.find(({ pattern }) => pattern.test(normalized));
  if (reviewMatch) {
    return {
      kind: 'action',
      id: 'review',
      label: reviewMatch.label,
      href: `${actionHref('review')}?type=${encodeURIComponent(reviewMatch.type)}`,
    };
  }
  if (/review|drs|decision|wicket/.test(normalized)) {
    return { kind: 'action', id: 'review', label: 'Review', href: actionHref('review') };
  }

  // Not an obvious action — answer as a help query.
  const topic = detectHelpTopic(normalized);
  return { kind: 'help', question: raw, answer: topic.answer, actions: topic.actions };
}