export type Outcome = 'beat' | 'run' | 'lbw';

export type Point = { x: number; y: number };

export const BOUNCE_T = 0.42;
export const IMPACT_T = 0.95;

/* Umpire-end view — camera looks down the pitch from the bowler's end, so the
   ball travels AWAY from the camera and shrinks slightly as it nears the batter.
   First arc: ball from hand to pitch. Second arc: a flat post-bounce ride low
   toward the wicket (no cartoon lift), which the umpire "projects" to the stumps. */
export const START: Point = { x: 330, y: 248 };
export const FLIGHT_CONTROL: Point = { x: 327, y: 221 };
export const BOUNCE: Point = { x: 323, y: 205 };
export const PAD: Point = { x: 322, y: 163 };
export const STUMP_HIT: Point = { x: 322, y: 138 };

export const SEG2_CONTROL: Record<Outcome, Point> = {
  beat: { x: 323, y: 186 },
  run: { x: 331, y: 180 },
  lbw: { x: 323, y: 186 },
};

export const SEG2_END: Record<Outcome, Point> = {
  beat: { x: 328, y: 154 },
  run: { x: 356, y: 120 },
  lbw: PAD,
};

export function bezier(a: Point, b: Point, c: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * b.x + t * t * c.x,
    y: u * u * a.y + 2 * u * t * b.y + t * t * c.y,
  };
}

/** BAll position along the delivery: release -> flight -> pitch -> impact. */
export function deliveryPosition(outcome: Outcome, progress: number): Point {
  if (progress <= 0) return START;
  if (progress <= BOUNCE_T) {
    return bezier(START, FLIGHT_CONTROL, BOUNCE, progress / BOUNCE_T);
  }
  const t = Math.min((progress - BOUNCE_T) / (1 - BOUNCE_T), 1);
  return bezier(BOUNCE, SEG2_CONTROL[outcome], SEG2_END[outcome], t);
}

/** Ball size by distance from the camera — shrinks as it travels away. */
export function ballRadiusAt(y: number): number {
  return 1.7 + ((y - 116) / 236) * 4.1;
}

/** Ground shadow that stays under the ball the whole way down. */
export function ballShadow(pos: Point): Point {
  return { x: pos.x + (pos.x - 320) * 0.08, y: Math.min(pos.y + 16, 352) };
}

/** Trace of the path the ball has covered so far (used for the trajectory). */
export function flightPath(outcome: Outcome, progress: number): string {
  const steps = 56;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const p = deliveryPosition(outcome, (progress * i) / steps);
    pts.push(`${p.x.toFixed(1)},${p.y.toFixed(1)}`);
  }
  return pts.join(' ');
}