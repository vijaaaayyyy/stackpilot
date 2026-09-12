'use client';

import {
  BOUNCE,
  BOUNCE_T,
  IMPACT_T,
  PAD,
  STUMP_HIT,
  ballRadiusAt,
  ballShadow,
  deliveryPosition,
  flightPath,
} from '@/lib/drs/trajectory';
import { useId } from 'react';

/**
 * Simplified umpire-end camera for local turf / gully cricket reviews.
 * Single clean view: ball path, pitch impact marker, and a flat dotted
 * projection to the stumps when the wicket is hit. No broadcast clutter.
 */
export function UmpireCamScene({
  type,
  progress,
  overlays,
  evidence,
}: {
  type: string;
  progress: number;
  overlays: boolean;
  evidence: unknown;
}) {
  const groundId = useId();
  const trailId = useId();
  const stumpGlowId = useId();

  const outcome: 'lbw' | 'beat' = type === 'lbw' ? 'lbw' : 'beat';
  const isLbw = type === 'lbw';

  const pos =
    progress >= IMPACT_T ? PAD : progress <= 0 ? deliveryPosition(outcome, 0) : deliveryPosition(outcome, progress);
  const radius = ballRadiusAt(pos.y);
  const shadow = ballShadow(pos);
  const trail = flightPath(outcome, progress);
  const pitched = progress >= BOUNCE_T;
  const atImpact = progress >= IMPACT_T;

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#070d09]">
      <svg viewBox="0 0 640 360" className="h-auto w-full" role="img" aria-label="Umpire-end camera replay">
        <defs>
          <linearGradient id={groundId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0f2418" />
            <stop offset="100%" stopColor="#08150e" />
          </linearGradient>
          <radialGradient id={stumpGlowId}>
            <stop offset="0%" stopColor="rgba(94,234,212,0.5)" />
            <stop offset="100%" stopColor="rgba(94,234,212,0)" />
          </radialGradient>
          <filter id={trailId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="2" />
          </filter>
        </defs>

        {/* Sky + ground */}
        <rect width="640" height="360" fill="#05080d" />
        <line x1="0" y1="140" x2="640" y2="140" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        <rect x="0" y="140" width="640" height="220" fill={`url(#${groundId})`} />

        {/* Pitch */}
        <polygon
          points="308,118 332,118 398,352 242,352"
          fill="rgba(122,168,112,0.26)"
          stroke="rgba(176,224,167,0.2)"
          strokeWidth="1.2"
        />
        <line x1="320" y1="118" x2="320" y2="352" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />

        {/* Creases */}
        <line x1="303" y1="146" x2="337" y2="146" stroke="rgba(240,246,232,0.45)" strokeWidth="1.4" />
        <line x1="300" y1="138" x2="340" y2="138" stroke="rgba(240,246,232,0.22)" strokeWidth="1" />
        <line x1="242" y1="330" x2="398" y2="330" stroke="rgba(240,246,232,0.4)" strokeWidth="1.4" />

        {/* Far stumps + bails */}
        <g strokeLinecap="round">
          <line x1="312" y1="118" x2="312" y2="131" stroke="#ecc391" strokeWidth="1.4" />
          <line x1="320" y1="118" x2="320" y2="131" stroke="#ecc391" strokeWidth="1.4" />
          <line x1="328" y1="118" x2="328" y2="131" stroke="#ecc391" strokeWidth="1.4" />
        </g>
        <line x1="310" y1="118" x2="330" y2="118" stroke="#f6dea8" strokeWidth="1.4" strokeLinecap="round" />

        {/* Soft wicket highlight when the projection hits */}
        {isLbw && pitched && (
          <ellipse cx="320" cy="132" rx="30" ry="16" fill={`url(#${stumpGlowId})`} />
        )}

        {/* Batter + keeper silhouettes (far end) */}
        <line x1="320" y1="133" x2="320" y2="120" stroke="#c9d1de" strokeWidth="3" strokeLinecap="round" />
        <circle cx="320" cy="117" r="3" fill="#0d1230" />
        <line x1="322" y1="125" x2="334" y2="113" stroke="#d9b98c" strokeWidth="2" strokeLinecap="round" />
        <ellipse cx="320" cy="145" rx="6" ry="1.4" fill="rgba(0,0,0,0.4)" />
        <g opacity="0.8">
          <line x1="344" y1="140" x2="344" y2="132" stroke="#c9d2e0" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="344" cy="130" r="1.8" fill="#0d1230" />
        </g>

        {/* Bowler (near, cropped) */}
        <g opacity="0.85">
          <line x1="316" y1="332" x2="302" y2="360" stroke="#1a2238" strokeWidth="4" strokeLinecap="round" />
          <line x1="322" y1="332" x2="336" y2="360" stroke="#1a2238" strokeWidth="4" strokeLinecap="round" />
          <line x1="319" y1="332" x2="312" y2="262" stroke="#263049" strokeWidth="5" strokeLinecap="round" />
          <line x1="312" y1="272" x2="330" y2="250" stroke="#1a2140" strokeWidth="3" strokeLinecap="round" />
          <circle cx="310" cy="256" r="5" fill="#0b1020" />
        </g>
        {/* Near stumps, cropped */}
        <g strokeLinecap="round">
          <line x1="308" y1="352" x2="308" y2="368" stroke="#c98f5f" strokeWidth="6" />
          <line x1="320" y1="352" x2="320" y2="368" stroke="#c98f5f" strokeWidth="6" />
          <line x1="332" y1="352" x2="332" y2="368" stroke="#c98f5f" strokeWidth="6" />
          <line x1="305" y1="352" x2="335" y2="352" stroke="#e7b27d" strokeWidth="3" />
        </g>

        {/* Trajectory so far */}
        {progress > 0.04 && (
          <g opacity={overlays ? 0.7 : 1}>
            <polyline
              points={trail}
              fill="none"
              stroke="rgba(94,234,212,0.5)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${trailId})`}
            />
            <polyline
              points={trail}
              fill="none"
              stroke="rgba(196,255,242,0.85)"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        )}

        {/* Flat dotted projection to the stumps (LBW) */}
        {isLbw && pitched && (
          <g>
            <line
              x1={BOUNCE.x}
              y1={BOUNCE.y}
              x2={STUMP_HIT.x}
              y2={STUMP_HIT.y}
              stroke="rgba(94,234,212,0.7)"
              strokeWidth="2"
              strokeDasharray="5 5"
              strokeLinecap="round"
            />
            <circle cx={STUMP_HIT.x} cy={STUMP_HIT.y} r="2.4" fill="#5eead4" />
          </g>
        )}

        {/* Pitch impact marker */}
        {pitched && (
          <g>
            <line x1="327" y1="202" x2="366" y2="196" stroke="rgba(231,245,216,0.5)" strokeWidth="1" strokeDasharray="2 2" />
            <rect x="370" y="188" width="122" height="19" rx="4" fill="rgba(7,11,9,0.8)" stroke="rgba(231,245,216,0.25)" strokeWidth="0.8" />
            <text x="378" y="202" fill="#eef7df" fontSize="9.5" fontWeight="600" letterSpacing="1.2">
              {isLbw ? 'IMPACT · IN LINE' : 'PITCH · IN LINE'}
            </text>
          </g>
        )}

        {/* Wicket projection verdict */}
        {isLbw && pitched && (
          <g>
            <rect x="306" y="72" width="188" height="24" rx="6" fill="rgba(7,11,9,0.85)" stroke="rgba(251,113,133,0.4)" strokeWidth="1" />
            <text x="400" y="88" textAnchor="middle" fill="#fda4af" fontSize="10.5" fontWeight="700" letterSpacing="1.6">
              WICKET PROJECTION · HITTING
            </text>
          </g>
        )}

        {/* Conviction badge when frozen at impact */}
        {atImpact && (
          <circle cx={PAD.x} cy={PAD.y} r="4" fill="#fb7185" opacity="0.9" />
        )}

        {/* Ball + shadow */}
        {!atImpact && (
          <g>
            <ellipse cx={shadow.x} cy={shadow.y} rx={radius * 1.05} ry={radius * 0.5} fill="rgba(0,0,0,0.4)" filter={`url(#${trailId})`} />
            <circle cx={pos.x} cy={pos.y} r={radius} fill="#f58a91" stroke="rgba(255,255,255,0.5)" strokeWidth="0.8" />
            <circle cx={pos.x - radius * 0.3} cy={pos.y - radius * 0.35} r={radius * 0.32} fill="rgba(255,255,255,0.4)" />
          </g>
        )}
      </svg>

      <span className="pointer-events-none absolute left-3 top-3 rounded border border-white/10 bg-black/60 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.2em] text-white/70">
        Cam 01 · Umpire End
      </span>
    </div>
  );
}