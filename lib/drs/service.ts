import type {
  Camera,
  Decision,
  Delivery,
  Match,
  Review,
  ReviewEvidence,
  ReviewTypeId,
} from './types';

/**
 * Turf DRS service contracts.
 *
 * These interfaces are the seam where real hardware / CV / audio processing can
 * be plugged in later. Every implementation ships as an async function and the
 * UI only ever talks to these abstractions, never to a concrete vendor.
 */

export interface DrsService {
  getMatch(matchId?: string): Promise<Match>;
  getDeliveries(matchId?: string): Promise<Delivery[]>;
  getCameras(matchId?: string): Promise<Camera[]>;
  requestEvidence(input: { matchId: string; ballId: string; type: ReviewTypeId }): Promise<ReviewEvidence>;
  finalizeReview(input: {
    matchId: string;
    ballId: string;
    type: ReviewTypeId;
    decision: Decision;
    onField: Decision | 'SIX';
  }): Promise<Review>;
}

export interface CameraService {
  list(matchId?: string): Promise<Camera[]>;
  setRecording(cameraId: string, recording: boolean): Promise<Camera>;
}

export interface MatchService {
  get(matchId?: string): Promise<Match>;
  deliveries(matchId?: string): Promise<Delivery[]>;
}

export interface ReviewService {
  requestEvidence(input: { matchId: string; ballId: string; type: ReviewTypeId }): Promise<ReviewEvidence>;
  finalize(input: { matchId: string; ballId: string; type: ReviewTypeId; decision: Decision; onField: Decision | 'SIX' }): Promise<Review>;
}

/** In-memory cache of an async call to keep re-renders cheap. */
export function makeCached<T>(producer: () => Promise<T>) {
  let promise: Promise<T> | null = null;
  return () => {
    if (!promise) promise = producer();
    return promise;
  };
}