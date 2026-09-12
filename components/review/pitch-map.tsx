'use client';

import type { ReviewEvidence } from '@/lib/drs/types';

/**
 * Top-down / "isometric" pitch map used for LBW ball-tracking evidence.
 * Renders the trajectory line, impact point (IN LINE) and the projected
 * path to the stumps (HITTING).
 */
export function PitchMap({
  evidence,
  showDecision = false,
  decision = 'OUT',
}: {
  evidence: ReviewEvidence | null;
  showDecision?: boolean;
  decision?: 'OUT' | 'NOT OUT' | 'INCONCLUSIVE';
}) {
  const out = decision === 'OUT';
  const inconclusive = decision === 'INCONCLUSIVE';
  const decisionColor = inconclusive ? '#fbbf24' : out ? '#fb7185' : '#34d399';
  const decisionLabel = inconclusive ? 'INCONCLUSIVE' : out ? 'OUT' : 'NOT OUT';

  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-[#06120c]">
      <svg
        viewBox="0 0 640 360"
        className="h-auto w-full"
        role="img"
        aria-label="Top-down pitch ball tracking visualization"
      >
        <defs>
          <radialGradient id="pitch-field-glow" cx="50%" cy="50%" r="65%">
            <stop offset="0%" stopColor="#0d2419" />
            <stop offset="100%" stopColor="#04120b" />
          </radialGradient>
          <linearGradient id="pitch-strip-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2b4a33" />
            <stop offset="100%" stopColor="#1d3826" />
          </linearGradient>
        </defs>

        {/* Field */}
        <rect width="640" height="360" fill="url(#pitch-field-glow)" />
        <ellipse cx="320" cy="180" rx="300" ry="150" fill="none" stroke="rgba(134,196,150,0.18)" strokeWidth="1.5" strokeDasharray="2 10" />

        {/* Pitch (top-down strip) */}
        <rect x="276" y="78" width="88" height="208" rx="8" fill="url(#pitch-strip-g)" stroke="rgba(170,220,160,0.25)" strokeWidth="1.5" />

        {/* Creases */}
        <line x1="280" y1="96" x2="360" y2="96" stroke="rgba(240,245,230,0.5)" strokeWidth="2" />
        <line x1="280" y1="270" x2="360" y2="270" stroke="rgba(240,245,230,0.5)" strokeWidth="2" />
        <line x1="298" y1="272" x2="342" y2="272" stroke="rgba(240,245,230,0.28)" strokeWidth="1.5" />

        {/* Bowling-end stumps (top) */}
        {[312, 320, 328].map((x) => (
          <circle key={`bw-${x}`} cx={x} cy="104" r="3.4" fill="#e7b27d" />
        ))}
        <line x1="310" y1="112" x2="330" y2="112" stroke="#e7b27d" strokeWidth="1.5" />

        {/* Batting-end stumps (bottom) */}
        {[312, 320, 328].map((x) => (
          <circle
            key={`bt-${x}`}
            cx={x}
            cy="262"
            r="3.6"
            fill={out ? '#fb7185' : '#e7b27d'}
            style={out ? { filter: 'drop-shadow(0 0 6px rgba(251,113,133,0.9))' } : undefined}
          />
        ))}
        <line x1="310" y1="270" x2="330" y2="270" stroke={out ? '#fb7185' : '#e7b27d'} strokeWidth="2" />

        {/* Batter marker */}
        <circle cx="320" cy="286" r="6" fill="rgba(230,233,239,0.85)" />
        <line x1="318" y1="286" x2="336" y2="272" stroke="#d9b98c" strokeWidth="2.5" strokeLinecap="round" />

        {/* Trajectory line (bowler -> impact) */}
        {evidence?.trajectory && evidence.trajectory.length > 1 ? (
          <polyline
            points={evidence.trajectory.map((p) => `${p.x + 10},${p.y + 34}`).join(' ')}
            fill="none"
            stroke="rgba(103,232,249,0.85)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M 322 86 C 336 120 352 152 356 176 C 360 200 344 214 324 222"
            fill="none"
            stroke="rgba(103,232,249,0.85)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        )}

        {/* Impact marker — IN LINE */}
        <g transform="translate(336, 220)">
          <circle r="10" fill="none" stroke="rgba(251,191,36,0.95)" strokeWidth="2.2" />
          <circle r="2.6" fill="#fbbf24" />
          <rect x="14" y="-12" width="72" height="16" rx="4" fill="#0b0f1a" stroke="rgba(251,191,36,0.5)" />
          <text x="20" y="-1" fontSize="9.5" fill="#fbbf24" fontFamily="monospace" letterSpacing="1.5">
            IN LINE
          </text>
        </g>

        {/* Projected path to stumps — HITTING */}
        <line
          x1="324"
          y1="222"
          x2="318"
          y2="258"
          stroke="rgba(251,191,36,0.5)"
          strokeWidth="2.5"
          strokeDasharray="5 4"
        />
        <g transform="translate(298, 232)">
          <rect x="0" y="-12" width="86" height="16" rx="4" fill="#0b0f1a" stroke="rgba(251,191,36,0.5)" />
          <text x="6" y="-1" fontSize="9.5" fill="#fbbf24" fontFamily="monospace" letterSpacing="1.5">
            HITTING
          </text>
        </g>

        {/* Ball at impact */}
        <circle cx="324" cy="222" r="4" fill="#f58a91" stroke="rgba(255,255,255,0.5)" strokeWidth="1" />
      </svg>

      {/* Labels: CV analysis vs third umpire decision */}
      <div className="flex flex-wrap items-center gap-2 p-3 sm:gap-3">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] text-cyan-300 sm:text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          Ball Tracking
        </span>
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.18em] sm:text-[10px]"
          style={{
            borderColor: showDecision ? `${decisionColor}99` : 'rgba(255,255,255,0.25)',
            background: showDecision ? `${decisionColor}1f` : 'rgba(255,255,255,0.04)',
            color: showDecision ? decisionColor : 'rgba(255,255,255,0.55)',
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: showDecision ? decisionColor : 'rgba(255,255,255,0.4)' }} />
          Third Umpire Decision
          {showDecision && <span className="font-bold">{decisionLabel}</span>}
        </span>
      </div>
    </div>
  );
}