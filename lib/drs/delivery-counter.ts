'use client';

/*
 * Per-match delivery counter: tracks the live over/ball (1.1, 1.2, ... 1.6,
 * 2.1, ...) so every captured clip is keyed to a real delivery, not a frozen
 * demo value. Written to localStorage for instant access; the same label is
 * persisted with the clip in Supabase Storage/Postgres.
 */

export type DeliveryHandle = {
  over: number;
  ball: number;
  label: string;
};

function keyOf(matchId: string): string {
  return `turf-drs:ball:${matchId}`;
}

const BALLS_PER_OVER = 6;

/** Current delivery handle for `matchId` (defaults to the first ball, 1.1). */
export function currentDelivery(matchId: string): DeliveryHandle {
  if (typeof window === 'undefined') return { over: 1, ball: 1, label: '1.1' };
  try {
    const raw = window.localStorage.getItem(keyOf(matchId));
    if (raw) {
      const { over, ball } = JSON.parse(raw) as { over: number; ball: number };
      return { over, ball, label: `${over}.${ball}` };
    }
  } catch {
    /* fall through to the first ball */
  }
  return { over: 1, ball: 1, label: '1.1' };
}

/** Advance to the next legal delivery and return it. */
export function nextDelivery(matchId: string): DeliveryHandle {
  const current = currentDelivery(matchId);
  const ball = current.ball + 1;
  const next = ball > BALLS_PER_OVER ? { over: current.over + 1, ball: 1 } : { over: current.over, ball };
  const handle: DeliveryHandle = { ...next, label: `${next.over}.${next.ball}` };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(keyOf(matchId), JSON.stringify({ over: next.over, ball: next.ball }));
    } catch {
      /* storage unavailable */
    }
  }
  return handle;
}

/** Reset the counter back to the first delivery. */
export function resetDeliveryCounter(matchId: string): void {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(keyOf(matchId));
    } catch {
      /* storage unavailable */
    }
  }
}