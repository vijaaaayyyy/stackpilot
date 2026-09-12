'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import type { Decision, Review, ReviewStatus, ReviewTypeId } from './types';

type ReviewRow = {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  match_id: string;
  match_label: string;
  ball_id: string;
  type: ReviewTypeId;
  on_field: Decision | 'SIX';
  decision: Decision;
  status: ReviewStatus;
  reason: string;
  created_at: string;
};

function fromRow(row: ReviewRow): Review {
  return {
    id: row.id,
    matchId: row.match_id,
    matchLabel: row.match_label,
    ballId: row.ball_id,
    type: row.type,
    onField: row.on_field,
    decision: row.decision,
    status: row.status,
    reason: row.reason,
    createdAt: new Date(row.created_at).getTime(),
    userEmail: row.user_email ?? undefined,
    userName: row.user_name ?? undefined,
  };
}

function toRow(review: Review): Omit<ReviewRow, 'id' | 'user_id' | 'created_at'> {
  return {
    user_email: review.userEmail ?? null,
    user_name: review.userName ?? null,
    match_id: review.matchId,
    match_label: review.matchLabel,
    ball_id: review.ballId,
    type: review.type,
    on_field: review.onField,
    decision: review.decision,
    status: review.status,
    reason: review.reason,
  };
}

const REVIEWS_CHANGED = 'turf-drs:reviews-changed';
const REVIEWS_LOCAL_KEY = 'turf-drs:reviews';

function readLocal(): Review[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(REVIEWS_LOCAL_KEY);
    return raw ? (JSON.parse(raw) as Review[]) : [];
  } catch {
    return [];
  }
}

function writeLocal(reviews: Review[]): void {
  try {
    window.localStorage.setItem(REVIEWS_LOCAL_KEY, JSON.stringify(reviews));
  } catch {
    // storage unavailable
  }
}

function notifyChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(REVIEWS_CHANGED));
  }
}

async function listRemote(): Promise<Review[]> {
  if (!isSupabaseConfigured) return [];
  const client = createClient();
  const { data, error } = await client
    .from('drs_reviews')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return ((data ?? []) as ReviewRow[]).map(fromRow);
}

export async function listReviews(): Promise<Review[]> {
  const local = readLocal();
  let remote: Review[] = [];
  try {
    remote = await listRemote();
  } catch {
    /* drs_reviews table may not exist yet — fall back to the local journal */
  }
  const merged = new Map<string, Review>();
  for (const review of remote) merged.set(review.id, review);
  for (const review of local) {
    if (!merged.has(review.id)) merged.set(review.id, review);
  }
  return [...merged.values()].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100);
}

export async function saveReview(review: Review): Promise<void> {
  const local = readLocal();
  writeLocal([review, ...local.filter((item) => item.id !== review.id)].slice(0, 100));
  if (isSupabaseConfigured) {
    try {
      const client = createClient();
      const { data } = await client.auth.getUser();
      const sessionEmail = data.user?.email ?? null;
      const sessionName =
        typeof data.user?.user_metadata?.name === 'string' ? data.user.user_metadata.name : null;
      await client.from('drs_reviews').upsert({
        ...toRow(review),
        id: review.id,
        user_id: data.user?.id ?? null,
        user_email: review.userEmail ?? sessionEmail,
        user_name: review.userName ?? sessionName,
      });
    } catch {
      /* remote unavailable — review is kept in the local journal */
    }
  }
  notifyChanged();
}

export async function clearReviews(): Promise<void> {
  writeLocal([]);
  if (isSupabaseConfigured) {
    try {
      const client = createClient();
      await client
        .from('drs_reviews')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
    } catch {
      /* remote unavailable */
    }
  }
  notifyChanged();
}

/** Reactive hook for the review history / any component watching the list. */
export function useReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      setReviews(await listReviews());
    } catch {
      setError('Could not load reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener(REVIEWS_CHANGED, load);
    return () => window.removeEventListener(REVIEWS_CHANGED, load);
  }, [load]);

  const add = useCallback(
    async (review: Review) => {
      try {
        await saveReview(review);
      } finally {
        await load();
      }
    },
    [load],
  );

  const reset = useCallback(async () => {
    try {
      await clearReviews();
    } finally {
      await load();
    }
  }, [load]);

  return { reviews, add, reset, loading, error };
}