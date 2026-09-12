'use client';

import { useId, useMemo } from 'react';
import type { ReviewEvidence, ReviewTypeId } from '@/lib/drs/types';

const TOTAL_SECONDS = 6;
const TRAIL_SECONDS = 0.28;

type Point = { x: number; y: number };

/* Side-on (square-leg) sequence timing */
export const RELEASE_T = 0.26;
export const BOUNCE_T = 0.56;
export const IMPACT_T = 0.73;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

function bezier(a: Point, c1: Point, c2: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * b.x,
    y: u * u * u * a.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * b.y,
  };
}

const BOWLER_FT = 318;
const BOWLER_X0 = 46;
const BOWLER_X1 = 190;

const RUN_HAND_REL_X0 = 12;
const RUN_HAND_REL_X1 = 38;
const RUN_HAND_REL_Y0 = -78;
const RUN_HAND_REL_Y1 = -152;

const RELEASE_PT: Point = { x: 228, y: 166 };
const BOUNCE_PT: Point = { x: 368, y: 296 };
const IMPACT_PT: Point = { x: 524, y: 272 };
const SETTLE_PT: Point = { x: 614, y: 214 };

/** Position of the bowled/held ball at any progress (0..1). */
export function ballPosition(progress: number): Point {
  if (progress <= RELEASE_T) {
    return runHand(progress);
  }
  if (progress <= BOUNCE_T) {
    return bezier(RELEASE_PT, { x: 300, y: 112 }, { x: 332, y: 262 }, BOUNCE_PT, (progress - RELEASE_T) / (BOUNCE_T - RELEASE_T));
  }
  if (progress <= IMPACT_T) {
    return bezier(BOUNCE_PT, { x: 452, y: 180 }, { x: 480, y: 126 }, IMPACT_PT, (progress - BOUNCE_T) / (IMPACT_T - BOUNCE_T));
  }
  return bezier(IMPACT_PT, { x: 556, y: 262 }, { x: 566, y: 182 }, SETTLE_PT, (progress - IMPACT_T) / (1 - IMPACT_T));
}

/** Bowing-arm hand position while carrying the ball during the run-up. */
function runHand(progress: number): Point {
  const runT = ease(clamp01(progress / RELEASE_T));
  const bx = lerp(BOWLER_X0, BOWLER_X1, runT);
  const relX = lerp(RUN_HAND_REL_X0, RUN_HAND_REL_X1, runT);
  const relY = lerp(RUN_HAND_REL_Y0, RUN_HAND_REL_Y1, runT);
  return { x: bx + relX, y: BOWLER_FT + relY };
}

export function buildTrail(): Point[] {
  const steps: Point[] = [];
  for (let i = 0; i <= 300; i++) {
    steps.push(ballPosition(i / 300));
  }
  return steps;
}

/* Dense samples of the true flight path — bowler's hand → pitch → pad impact. */
function buildFlightPath(): Point[] {
  const pts: Point[] = [];
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const p = RELEASE_T + ((IMPACT_T - RELEASE_T) * i) / N;
    pts.push(ballPosition(p));
  }
  return pts;
}

/* Projected continuation of the ball after pad impact, stopping just past the stumps. */
function buildProjection(): Point[] {
  const pts: Point[] = [];
  const N = 48;
  for (let i = 0; i <= N; i++) {
    const p = IMPACT_T + ((1 - IMPACT_T) * i) / N;
    const pt = ballPosition(p);
    pts.push(pt);
    if (pt.x >= 594) break;
  }
  return pts;
}

/* Ground surface height under a given x (pitch recedes to the right). */
const groundY = (x: number) => lerp(348, 262, clamp01((x - 128) / 456));

/* =========================== Illustrated primitives =========================== */

function Limb({
  a,
  b,
  width,
  color,
  shade,
  depth = 0,
}: {
  a: Point;
  b: Point;
  width: number;
  color: string;
  shade: string;
  depth?: number;
}) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  const cx = (a.x + b.x) / 2 + px * depth;
  const cy = (a.y + b.y) / 2 + py * depth;
  const d = `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`;
  return (
    <g>
      <path d={d} fill="none" stroke={shade} strokeWidth={width + 1.8} strokeLinecap="round" />
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </g>
  );
}

function Boot({ x, y, color = '#131a22' }: { x: number; y: number; color?: string }) {
  return (
    <g>
      <ellipse cx={x} cy={y - 1} rx={6.2} ry={3.6} fill={color} />
      <ellipse cx={x + 2.6} cy={y - 1.6} rx={2.6} ry={1.7} fill="rgba(255,255,255,0.12)" />
    </g>
  );
}

function Head({
  cx,
  cy,
  r,
  skin = '#d9a276',
  rim = '#d9895d',
  kit = '#14203a',
  facing = 1,
  cap = false,
  helmet = false,
}: {
  cx: number;
  cy: number;
  r: number;
  skin?: string;
  rim?: string;
  kit?: string;
  facing?: 1 | -1;
  cap?: boolean;
  helmet?: boolean;
}) {
  return (
    <g>
      <circle cx={cx} cy={cy + 1} r={r - 0.5} fill={skin} />
      <path d={`M ${cx - r} ${cy + 2.5} a ${r} ${r} 0 0 1 ${r * 2} 0 q 0 -${r * 0.35} -${r} -${r * 0.3} Z`} fill={skin} />
      {helmet ? (
        <g>
          <path d={`M ${cx - r} ${cy + 1.5} a ${r} ${r} 0 0 1 ${r * 2} 0 l 0 -${r * 0.42} q -${r} -${r * 0.35} -${r * 2} 0 Z`} fill={kit} />
          <rect x={cx - r} y={cy - 1.2} width={r * 2} height={2.6} rx={1.3} fill={rim} opacity={0.9} />
          <rect x={cx - r * 0.15} y={cy + 0.4} width={r * 0.75} height={r * 0.9} rx={1.5} fill={kit} opacity={0.92} />
          <rect x={cx + r * 0.1} y={cy + 1.2} width={r * 0.62} height={r * 0.8} rx={1.4} fill={kit} opacity={0.8} />
        </g>
      ) : cap ? (
        <g>
          <path d={`M ${cx - r} ${cy + 2} a ${r} ${r} 0 0 1 ${r * 2} 0 l 0 -${r * 0.5} q -${r} -${r * 0.5} -${r * 2} 0 Z`} fill={kit} />
          <rect x={cx - r} y={cy - 1} width={r * 2} height={2.4} rx={1.2} fill={kit} />
          <path d={`M ${cx + facing * (r - 0.5)} ${cy - 2.5} l ${facing * 6} -2 l ${facing * -2.5} 2.6 Z`} fill={kit} />
        </g>
      ) : (
        <path d={`M ${cx - r * 0.85} ${cy - r * 0.7} a ${r * 0.86} ${r * 0.86} 0 0 1 ${r * 1.7} 0 q 0 -${r * 0.6} -${r * 1.7} 0 Z`} fill="#1c2330" />
      )}
    </g>
  );
}

function GlowDef({ id }: { id: string }) {
  return (
    <filter id={id} x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="1.8" result="b" />
      <feMerge>
        <feMergeNode in="b" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  );
}

function Chip({
  x,
  y,
  text,
  color,
  on = false,
}: {
  x: number;
  y: number;
  text: string;
  color: string;
  on?: boolean;
}) {
  const w = text.length * 6.4 + 20;
  return (
    <g>
      <rect x={x} y={y} width={w} height={16} rx={4.5} fill="rgba(7,9,16,0.88)" stroke={color} strokeOpacity="0.55" />
      {on && (
        <circle cx={x + 8.5} cy={y + 8} r="2" fill={color}>
          <animate attributeName="opacity" values="1;0.25;1" dur="0.9s" repeatCount="indefinite" />
        </circle>
      )}
      <text
        x={x + (on ? 14.5 : 10)}
        y={y + 11.2}
        fontSize="9"
        fontWeight="700"
        fill={color}
        fontFamily="ui-monospace, monospace"
        letterSpacing="1.2"
      >
        {text}
      </text>
    </g>
  );
}

/* Live broadcast scoreboard — slim, always visible */
function Scoreboard({ sky }: { sky: string }) {
  return (
    <g>
      <rect x={14} y={12} width={162} height={46} rx={9} fill="rgba(8,10,18,0.82)" stroke="rgba(255,255,255,0.14)" />
      <rect x={14} y={12} width={2.5} height={46} rx={1} fill={sky} />
      <circle cx={25} cy={22} r={2.4} fill="#f43f5e">
        <animate attributeName="opacity" values="1;0.35;1" dur="1.2s" repeatCount="indefinite" />
      </circle>
      <text x={32} y={25} fontSize="9" fill="rgba(255,255,255,0.75)" fontFamily="ui-monospace, monospace" fontWeight="700">
        LIVE
      </text>
      <text x={82} y={25} fontSize="9" fill="rgba(255,255,255,0.42)" fontFamily="ui-monospace, monospace">
        HTL · DEMO
      </text>
      <text x={22} y={44} fontSize="11" fill="#e6fbef" fontFamily="ui-monospace, monospace" fontWeight="700">
        FALC
      </text>
      <text x={62} y={44} fontSize="11" fill="#94eebb" fontFamily="ui-monospace, monospace" fontWeight="700">
        178/5
      </text>
      <text x={112} y={44} fontSize="11" fill="#dbeafe" fontFamily="ui-monospace, monospace" fontWeight="700">
        STR
      </text>
      <text x={148} y={44} fontSize="11" fill="#9ec0ff" fontFamily="ui-monospace, monospace" fontWeight="700">
        142/4
      </text>
    </g>
  );
}

/* =========================== Main scene =========================== */

export function DeliveryScene({
  type,
  progress,
  overlays,
  evidence,
}: {
  type: ReviewTypeId;
  progress: number;
  overlays: boolean;
  evidence: ReviewEvidence | null;
}) {
  const skyId = useId();
  const groundId = useId();
  const fieldId = useId();
  const ballId = useId();
  const woodId = useId();
  const trailId = useId();
  const glowId = useId();

  const trail = useMemo(() => buildTrail(), []);
  const flightPath = useMemo(() => buildFlightPath(), []);
  const projection = useMemo(() => buildProjection(), []);
  const pos = ballPosition(progress);
  const t = type;

  const runT = ease(clamp01(progress / RELEASE_T));
  const delivery = clamp01((runT - 0.86) / 0.14);
  const stride = Math.sin(runT * Math.PI * 6);
  const bob = -Math.abs(stride) * 4;

  const bowX = lerp(BOWLER_X0, BOWLER_X1, runT);
  const bowY = BOWLER_FT + bob;
  const hip = { x: bowX + 2 + delivery * 3, y: bowY - 72 };
  const sh = { x: bowX + 8 + delivery * 2, y: bowY - 116 };
  const head = { x: bowX + 8 + delivery * 2, y: bowY - 130 };

  const frontFoot = { x: hip.x + lerp(stride * 20, 24, delivery), y: bowY + (delivery > 0.5 ? -2 : 0) };
  const backFoot = { x: hip.x + lerp(-stride * 20, -24, delivery), y: bowY + (delivery > 0.5 ? 9 : 0) };

  /* Bowling-arm hand follows the ball exactly until release */
  const follow = clamp01((progress - RELEASE_T) / 0.06);
  const hand = progress < RELEASE_T ? runHand(progress) : { x: 228 + 8 * follow, y: 166 + 36 * follow };
  const backHand = { x: sh.x - 20 + stride * 3, y: sh.y - 4 + delivery * 12 };

  /* Ball visuals */
  const showBall = !(overlays && progress >= IMPACT_T);
  const inFlight = progress >= RELEASE_T;
  const trailWindow = inFlight
    ? trail.filter(
        (p, i) =>
          i / 300 <= progress &&
          i / 300 >= progress - TRAIL_SECONDS / TOTAL_SECONDS &&
          i / 300 >= RELEASE_T - 0.02,
      )
    : [];

  const overlaying = overlays && progress >= IMPACT_T;

  /* Progressive trajectory — the solid line draws itself as the ball travels */
  const flightProgress = clamp01((progress - RELEASE_T) / (IMPACT_T - RELEASE_T));
  const flightCount = Math.max(1, Math.round(flightProgress * (flightPath.length - 1)));
  const pathPoints = flightPath
    .slice(0, flightCount + 1)
    .map((p) => `${p.x},${p.y}`)
    .join(' ');

  /* Wicket projection (LBW) — dashed continuation after impact */
  const projPoints = projection.map((p) => `${p.x},${p.y}`).join(' ');
  const projectionEnd = projection[projection.length - 1] ?? SETTLE_PT;
  const showProjection = t === 'lbw' && progress >= IMPACT_T;
  const pitchLabel = t === 'lbw' ? 'IMPACT IN LINE' : 'PITCH · 10.3M';

  /* Soft cast shadow under the airborne ball */
  const hover = inFlight ? clamp01(1 - (pos.y - groundY(pos.x)) / 130) : 0;
  const ballGlow = inFlight || overlaying;

  const status =
    progress < RELEASE_T
      ? 'BOWLER RUNS IN'
      : progress < BOUNCE_T
        ? 'RELEASED · IN FLIGHT'
        : progress < IMPACT_T
          ? 'BOUNCED · RISING'
          : overlays
            ? t === 'lbw'
              ? 'IMPACT · IN LINE'
              : 'IMPACT'
            : 'TO THE STUMPS';
  const statusColor = progress >= IMPACT_T ? '#fbbf24' : '#67e8f9';

  const rop = evidence?.findings.find((f) => f.id === 'rope');
  const batShort = evidence?.batShortOfCrease;

  const wood = `url(#${woodId})`;
  const trailUrl = `url(#${trailId})`;

  return (
    <svg
      viewBox="0 0 640 360"
      className="h-auto w-full rounded-lg border border-white/10 bg-[#05070c] shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
      role="img"
      aria-label="Square-leg camera replay of a cricket delivery"
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#070a16" />
          <stop offset="26%" stopColor="#0c1226" />
          <stop offset="62%" stopColor="#131f3d" />
          <stop offset="100%" stopColor="#1a2440" />
        </linearGradient>
        <linearGradient id={groundId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0f2a1c" />
          <stop offset="55%" stopColor="#0a1f14" />
          <stop offset="100%" stopColor="#050d08" />
        </linearGradient>
        <radialGradient id={fieldId} cx="38%" cy="48%" r="85%">
          <stop offset="0%" stopColor="rgba(140,200,160,0.16)" />
          <stop offset="60%" stopColor="rgba(140,200,160,0.05)" />
          <stop offset="100%" stopColor="rgba(140,200,160,0)" />
        </radialGradient>
        <linearGradient id={woodId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f0cd96" />
          <stop offset="45%" stopColor="#e3b57a" />
          <stop offset="55%" stopColor="#c9965c" />
          <stop offset="100%" stopColor="#8a5f2f" />
        </linearGradient>
        <radialGradient id={ballId}>
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="70%" stopColor="#eef2f7" />
          <stop offset="100%" stopColor="#c2ccd9" />
        </radialGradient>
        <linearGradient id={trailId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(103,232,249,0.7)" />
          <stop offset="55%" stopColor="rgba(251,191,36,0.85)" />
          <stop offset="100%" stopColor="rgba(251,146,60,0.9)" />
        </linearGradient>
        <GlowDef id={glowId} />
      </defs>

      {/* Sky + atmosphere */}
      <rect width="640" height="360" fill={`url(#${skyId})`} />

      {/* Floodlight towers */}
      <g opacity="0.9">
        <circle cx="52" cy="26" r="26" fill="rgba(220,235,255,0.05)" filter={`url(#${glowId})`} />
        <circle cx="588" cy="24" r="30" fill="rgba(220,235,255,0.06)" filter={`url(#${glowId})`} />
        <rect x="34" y="16" width="26" height="9" rx="2" fill="#39465f" />
        <rect x="572" y="14" width="30" height="9" rx="2" fill="#39465f" />
        {[-8, 0, 8].map((o) => (
          <circle key={`l-${o}`} cx={47 + o} cy={14} r="1.6" fill="#cfe3ff" />
        ))}
        {[-8, 0, 8].map((o) => (
          <circle key={`r-${o}`} cx={587 + o} cy={12} r="1.6" fill="#cfe3ff" />
        ))}
      </g>

      {/* Stadium glow behind stumps */}
      <circle cx="560" cy="150" r="190" fill="rgba(129,140,248,0.08)" filter={`url(#${glowId})`} />
      <circle cx="470" cy="140" r="160" fill="rgba(34,211,238,0.05)" filter={`url(#${glowId})`} />

      {/* Ground */}
      <rect y="150" width="640" height="210" fill={`url(#${groundId})`} />
      <rect y="150" width="640" height="210" fill={`url(#${fieldId})`} />

      {/* Boundary arc */}
      <ellipse cx="320" cy="250" rx="300" ry="120" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.4" strokeDasharray="3 9" />

      {/* Soft pitch-side sheen along the horizon */}
      <line x1="0" y1="150" x2="640" y2="150" stroke="rgba(255,255,255,0.09)" />

      {/* ================= PITCH ================= */}
      <polygon
        points="112,318 574,250 586,284 126,350"
        fill="rgba(158,190,132,0.34)"
        stroke="rgba(196,224,176,0.3)"
        strokeWidth="1.6"
      />
      <polygon points="118,324 568,258 578,280 126,344" fill="rgba(174,198,150,0.22)" />

      {/* Pitch wear / footmarks */}
      <g opacity="0.28">
        <ellipse cx="300" cy="306" rx="16" ry="6" fill="rgba(120,140,96,0.5)" />
        <ellipse cx="344" cy="296" rx="20" ry="7" fill="rgba(120,140,96,0.45)" />
        <ellipse cx="402" cy="280" rx="22" ry="8" fill="rgba(128,146,102,0.4)" />
        <ellipse cx="474" cy="264" rx="18" ry="7" fill="rgba(128,146,102,0.4)" />
        <ellipse cx="540" cy="252" rx="14" ry="6" fill="rgba(120,140,96,0.5)" />
      </g>

      {/* Creases — bowler end */}
      <line x1="224" y1="296" x2="224" y2="338" stroke="rgba(246,250,240,0.7)" strokeWidth="2.2" />
      <line x1="214" y1="338" x2="234" y2="338" stroke="rgba(246,250,240,0.45)" strokeWidth="1.6" />
      <line x1="206" y1="314" x2="242" y2="306" stroke="rgba(246,250,240,0.3)" strokeWidth="1.3" />
      <line x1="222" y1="300" x2="226" y2="300" stroke="rgba(246,250,240,0.35)" strokeWidth="1.4" />

      {/* Creases — batting end */}
      <line x1="556" y1="252" x2="556" y2="282" stroke="rgba(246,250,240,0.7)" strokeWidth="2.2" />
      <line x1="588" y1="254" x2="588" y2="274" stroke="rgba(246,250,240,0.42)" strokeWidth="1.7" />
      <line x1="580" y1="276" x2="596" y2="270" stroke="rgba(246,250,240,0.3)" strokeWidth="1.3" />

      {/* Bowler's run-up lane */}
      <line
        x1="30"
        y1="334"
        x2="216"
        y2="334"
        stroke="rgba(255,255,255,0.13)"
        strokeWidth="1.6"
        strokeDasharray="9 8"
      />

      {/* ================= BOWLER-END STUMPS (background detail) ================= */}
      <g opacity="0.22" transform="translate(14 18) scale(0.7)">
        <g stroke="#9c6b2e">
          <line x1="572" y1="206" x2="572" y2="286" strokeWidth="4.5" />
          <line x1="580" y1="206" x2="580" y2="288" strokeWidth="4.5" />
          <line x1="588" y1="206" x2="588" y2="288" strokeWidth="4.5" />
        </g>
      </g>

      {/* ================= BATTER-END STUMPS ================= */}
      <g fill="none" strokeLinecap="round" stroke={wood} strokeWidth="5">
        <line x1="572" y1="206" x2="572" y2="286" />
        <line x1="580" y1="206" x2="580" y2="288" />
        <line x1="588" y1="206" x2="588" y2="288" />
      </g>
      <g fill="none" strokeLinecap="round" stroke="rgba(0,0,0,0.35)" strokeWidth="1.6">
        <line x1="572" y1="206" x2="572" y2="282" />
        <line x1="580" y1="206" x2="580" y2="284" />
        <line x1="588" y1="206" x2="588" y2="284" />
      </g>
      {/* Painted bands near the top */}
      <g fill="rgba(246,250,240,0.75)">
        <rect x="569.5" y="206" width="5" height="7" rx="1.5" />
        <rect x="577.5" y="206" width="5" height="7" rx="1.5" />
        <rect x="585.5" y="206" width="5" height="7" rx="1.5" />
      </g>
      {/* Bails */}
      <g fill={wood} stroke="rgba(0,0,0,0.3)" strokeWidth="0.6">
        <rect x="568.5" y="197" width="16" height="6" rx="3" transform="rotate(-7 576 200)" />
        <rect x="576" y="196.5" width="16" height="6" rx="3" transform="rotate(7 584 200)" />
      </g>

      {/* ================= WICKETKEEPER (crouched behind the stumps) ================= */}
      <g>
        <Limb a={{ x: 594, y: 288 }} b={{ x: 586, y: 304 }} width={9} color="#1f2b4a" shade="#10182e" depth={-8} />
        <Limb a={{ x: 594, y: 288 }} b={{ x: 610, y: 302 }} width={9} color="#2c3a60" shade="#151f39" depth={-6} />
        <Limb a={{ x: 598, y: 268 }} b={{ x: 594, y: 288 }} width={13} color="#243152" shade="#131c34" />
        <Limb a={{ x: 598, y: 268 }} b={{ x: 586, y: 280 }} width={7} color="#31406a" shade="#1a2542" depth={-9} />
        <ellipse cx="586" cy="282" rx="8" ry="4.4" fill="#d8d3c4" stroke="rgba(90,80,60,0.35)" strokeWidth="1" />
        <Head cx={597} cy={250} r={7.5} kit="#14203a" rim="#3a4f80" facing={-1} helmet />
        <Boot x={586} y={306} color="#0f141b" />
        <Boot x={610} y={304} color="#0f141b" />
      </g>

      {/* ================= BATTER (right-handed, side-on stance) ================= */}
      <g>
        {/* Bat (raised backlift) */}
        <path
          d="M 564 200 Q 562 244 548 268 L 544 262 Q 556 242 557 202 Z"
          fill={wood}
          stroke="rgba(70,40,10,0.4)"
          strokeWidth="1"
        />
        <path d="M 560 210 L 557 240 L 549 256 L 545 250 Z" fill="rgba(255,255,255,0.16)" />
        <line x1="548" y1="272" x2="550" y2="284" stroke="#33261c" strokeWidth="5" strokeLinecap="round" />
        <line x1="543" y1="285" x2="549" y2="268" stroke="#d9c8a8" strokeWidth="2.2" strokeLinecap="round" />

        {/* Legs + pads */}
        <Limb a={{ x: 540, y: 268 }} b={{ x: 546, y: 298 }} width={8} color="#24304f" shade="#141b33" depth={4} />
        <Limb a={{ x: 540, y: 268 }} b={{ x: 514, y: 302 }} width={8} color="#2c3a60" shade="#151f39" depth={-9} />
        <Limb a={{ x: 528, y: 286 }} b={{ x: 514, y: 302 }} width={13} color="#ece9e0" shade="#b9b5a9" depth={2} />
        <g opacity="0.5" stroke="#b9b5a9" strokeWidth="1">
          <line x1="524" y1="292" x2="519" y2="290" />
          <line x1="521" y1="298" x2="516" y2="296" />
        </g>

        {/* Torso + arms */}
        <Limb a={{ x: 534, y: 238 }} b={{ x: 540, y: 268 }} width={15} color="#24304f" shade="#141b33" depth={2} />
        <Limb a={{ x: 534, y: 238 }} b={{ x: 546, y: 254 }} width={6.5} color="#303d66" shade="#1a2442" depth={-8} />
        <Limb a={{ x: 534, y: 238 }} b={{ x: 541, y: 284 }} width={6.5} color="#2c3a60" shade="#151f39" depth={-6} />

        {/* Helmet + gloves */}
        <Head cx={528} cy={222} r={9} kit="#14203a" rim="#3f5a94" facing={-1} helmet />
        <ellipse cx="548" cy="256" rx="4.6" ry="5.4" fill="#d8d3c4" stroke="rgba(90,80,60,0.4)" strokeWidth="1" />
        <Boot x={546} y={300} color="#161c26" />
        <Boot x={514} y={304} color="#161c26" />
      </g>

      {/* ================= BOWLER (animated run-up + bowling action) ================= */}
      <g>
        {/* Far (trailing) leg */}
        <Limb a={hip} b={backFoot} width={10} color="#16233d" shade="#0d1526" depth={lerp(10, 26, delivery)} />
        {/* Near (front) leg */}
        <Limb a={hip} b={frontFoot} width={11} color="#28375c" shade="#182340" depth={lerp(12, 3, delivery)} />
        <Boot x={backFoot.x} y={backFoot.y} color="#0a0e14" />
        <Boot x={frontFoot.x} y={frontFoot.y} color="#0a0e14" />

        {/* Non-bowling arm (pumped, held across at delivery) */}
        <Limb a={sh} b={backHand} width={6.5} color="#123f31" shade="#0a2a20" depth={13} />

        {/* Torso */}
        <Limb a={hip} b={sh} width={17} color="#0f9d85" shade="#0b6d5a" depth={1} />
        <circle cx={hip.x} cy={hip.y} r={7} fill="#0c6b5a" />
        <circle cx={sh.x + 3} cy={sh.y - 2} r={8.5} fill="#0f9d85" />

        {/* Bowling arm (ball in hand → overhead release → follow-through) */}
        <g>
          <path
            d={`M ${sh.x} ${sh.y} Q ${(sh.x + hand.x) / 2 + 6} ${(sh.y + hand.y) / 2 - 2} ${hand.x} ${hand.y}`}
            fill="none"
            stroke="#0d8a72"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <circle cx={sh.x - 1} cy={sh.y} r={4.6} fill="#0d8a72" />
        </g>
        <circle cx={hand.x} cy={hand.y} r={3.4} fill="#d9a276" />

        {/* Head with cap */}
        <Head cx={head.x} cy={head.y} r={8} kit="#0f9d85" rim="#0a6b5a" facing={1} cap />
      </g>

      {/* ================= BALL ================= */}
      {showBall && (
        <g>
          {hover > 0.02 && (
            <ellipse
              cx={pos.x + 2}
              cy={groundY(pos.x)}
              rx={lerp(6, 2, hover)}
              ry={lerp(2.4, 1.2, hover)}
              fill={`rgba(0,0,0,${0.4 * hover})`}
            />
          )}
          <g filter={ballGlow ? `url(#${glowId})` : undefined}>
            <circle cx={pos.x} cy={pos.y} r={4.2} fill={`url(#${ballId})`} stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" />
            <path
              d={`M ${pos.x - 2.6} ${pos.y - 2.6} a 3.4 3.4 0 0 1 5.2 0`}
              fill="none"
              stroke="rgba(200,80,90,0.55)"
              strokeWidth="0.9"
              transform={`rotate(-24 ${pos.x} ${pos.y})`}
            />
          </g>
        </g>
      )}

      {/* ================= BALL TRACKING ================= */}
      {/* Actual flight path — draws progressively, soft teal with a bright core */}
      {inFlight && (
        <g pointerEvents="none">
          <polyline
            points={pathPoints}
            fill="none"
            stroke="rgba(103,232,249,0.32)"
            strokeWidth="3.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
          <polyline
            points={pathPoints}
            fill="none"
            stroke="rgba(238,248,255,0.85)"
            strokeWidth="1.3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Fresh trail right behind the moving ball */}
      {trailWindow.length > 1 && (
        <polyline
          points={trailWindow.map((p) => `${p.x},${p.y}`).join(' ')}
          fill="none"
          stroke={trailUrl}
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        />
      )}

      {/* Stump highlight when the projection is hitting */}
      {showProjection && (
        <g pointerEvents="none">
          <ellipse
            cx="580"
            cy="248"
            rx="30"
            ry="56"
            fill="rgba(251,191,36,0.1)"
            filter={`url(#${glowId})`}
          />
          <rect
            x="576.5"
            y="204"
            width="8"
            height="84"
            rx="3.5"
            fill="rgba(251,191,36,0.28)"
            stroke="rgba(255,220,130,0.85)"
            strokeWidth="1.4"
          />
        </g>
      )}

      {/* Wicket projection — dashed amber continuation toward the stumps */}
      {showProjection && (
        <g pointerEvents="none">
          <polyline
            points={projPoints}
            fill="none"
            stroke="rgba(251,191,36,0.7)"
            strokeWidth="2.4"
            strokeDasharray="7 6"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
          <polyline
            points={projPoints}
            fill="none"
            stroke="rgba(255,246,220,0.55)"
            strokeWidth="0.9"
            strokeDasharray="7 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={projectionEnd.x} cy={projectionEnd.y} r="2.4" fill="rgba(251,191,36,0.95)" />
          <Chip x={466} y={250} text="WICKET PROJECTION" color="#67e8f9" />
          <Chip x={486} y={272} text="HITTING" color="#f59e0b" />
        </g>
      )}

      {/* Pitch impact marker — pops in with a soft scale */}
      {progress >= BOUNCE_T && (
        <g pointerEvents="none">
          <g transform={`translate(${BOUNCE_PT.x} ${BOUNCE_PT.y})`}>
            <g>
              <animateTransform attributeName="transform" type="scale" values="0.4 0.4;1 1" dur="0.4s" fill="freeze" />
              <circle r="4" fill="rgba(251,146,60,0.95)" />
              <circle r="12.5" fill="none" stroke="rgba(251,146,60,0.9)" strokeWidth="2.2" />
              <circle r="19" fill="none" stroke="rgba(251,146,60,0.4)" strokeWidth="1.4" className="animate-ping" />
            </g>
          </g>
          <Chip x={344} y={316} text={pitchLabel} color="#f59e0b" />
        </g>
      )}

      {/* ================= FREEZE-FRAME ANALYSIS ================= */}
      {overlays && progress >= IMPACT_T && (
        <g>
          {t === 'lbw' && (
            <g>
              <circle
                cx={IMPACT_PT.x}
                cy={IMPACT_PT.y}
                r="27"
                fill="none"
                stroke="rgba(251,191,36,0.6)"
                strokeWidth="1.4"
                className="animate-ping"
              />
              <circle cx={IMPACT_PT.x} cy={IMPACT_PT.y} r="11" fill="rgba(251,191,36,0.16)" stroke="rgba(251,191,36,0.95)" strokeWidth="2.2" />
              <circle cx={IMPACT_PT.x} cy={IMPACT_PT.y} r="2.6" fill="#fbbf24" />
              <Chip x={534} y={206} text="IMPACT · 0.73S" color="#fbbf24" on />
            </g>
          )}
          {t === 'caught' && (
            <g>
              <circle cx="520" cy="200" r="24" fill="none" stroke="rgba(52,211,153,0.55)" strokeWidth="1.6" strokeDasharray="4 3" />
              <circle cx="520" cy="200" r="30" fill="none" stroke="rgba(52,211,153,0.4)" strokeWidth="1.1" className="animate-ping" />
              <Chip x={452} y={160} text="POSSIBLE CONTACT" color="#6ee7b7" on />
              <Chip x={452} y={182} text="AUDIO SPIKE · FRAME 241" color="#34d399" />
            </g>
          )}
          {t === 'runout' && (
            <g>
              <line x1="552" y1="253" x2="552" y2="284" stroke="rgba(251,191,36,0.9)" strokeWidth="3" strokeDasharray="6 4" />
              <circle cx="556" cy="282" r="8" fill="none" stroke="rgba(251,191,36,0.85)" strokeWidth="2" />
              <Chip x={560} y={240} text="CREASE · BAILS FRAME 258" color="#fbbf24" on />
              {batShort != null && <Chip x={560} y={262} text={`BAT SHORT ${batShort} CM`} color="#fb7185" />}
            </g>
          )}
          {t === 'stumping' && (
            <g>
              <circle cx="580" cy="206" r="22" fill="none" stroke="rgba(217,119,242,0.55)" strokeWidth="1.5" strokeDasharray="4 3" />
              <circle cx="580" cy="206" r="28" fill="none" stroke="rgba(217,119,242,0.4)" strokeWidth="1.1" className="animate-ping" />
              <Chip x={540} y={214} text="BAILS DISLODGED · 246" color="#e879f9" on />
              <Chip x={540} y={236} text="BAT OUT OF GROUND" color="#fb7185" />
            </g>
          )}
          {t === 'boundary' && (
            <g>
              <polyline
                points="600,150 612,162 602,182 616,204 604,222 614,244 602,260 616,282 606,304 618,330"
                fill="none"
                stroke="rgba(56,189,248,0.95)"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <Chip x={488} y={250} text={rop ? 'CLEAR DAYLIGHT' : 'ROPE CONTACT'} color="#7dd3fc" on />
            </g>
          )}
        </g>
      )}

      {overlaying && (
        <circle
          cx={IMPACT_PT.x}
          cy={IMPACT_PT.y}
          r="16"
          fill="none"
          stroke="rgba(251,191,36,0.7)"
          strokeWidth="1.4"
          className="animate-ping"
        />
      )}

      {/* ================= OVERLAY FRAMES ================= */}
      <Scoreboard sky="#67e8f9" />
      <Chip
        x={(640 - (status.length * 6.3 + 20)) / 2}
        y={28}
        text={status}
        color={statusColor}
        on={!overlays || progress >= IMPACT_T}
      />
      <g>
        <rect x={540} y={12} width={88} height={19} rx={4.5} fill="rgba(8,10,18,0.8)" stroke="rgba(255,255,255,0.12)" />
        <text
          x={548}
          y={25}
          fontSize="8.5"
          fill="rgba(255,255,255,0.6)"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
          letterSpacing="0.8"
        >
          CAM 03 · SQUARE LEG
        </text>
      </g>
    </svg>
  );
}