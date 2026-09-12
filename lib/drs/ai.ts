import type { ReviewEvidence, ReviewTypeId } from './types';

/**
 * Client wrapper for the third-umpire AI analysis endpoint. Sends the uploaded
 * clip to `/api/drs/analyze`, which runs a Gemini vision model over the video
 * and returns `ReviewEvidence`. On AI failure the server falls back to
 * simulated evidence (`analyzedBy: 'simulated'`) so the review never hangs.
 */

export type DrsAnalysis = {
  evidence: ReviewEvidence;
  analyzedBy: 'ai' | 'simulated';
  model?: string;
  latencyMs?: number;
  reason?: string;
  note?: string;
};

export async function analyzeDelivery(input: {
  matchId: string;
  ballId: string;
  type: ReviewTypeId;
  clipPath: string;
}): Promise<DrsAnalysis> {
  const response = await fetch('/api/drs/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(90_000),
    cache: 'no-store',
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`AI analysis failed (${response.status})${detail ? ` ${detail.slice(0, 160)}` : ''}`);
  }
  return (await response.json()) as DrsAnalysis;
}