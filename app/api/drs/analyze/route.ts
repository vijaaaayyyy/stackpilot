import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { DEMO_CAMERAS, demoService } from '@/lib/drs/demo-service';
import type {
  AudioAnalysis,
  Finding,
  ReviewEvidence,
  ReviewTypeId,
  TrajectoryPoint,
} from '@/lib/drs/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CLIPS_BUCKET = 'drs-clips';
const DRS_MODEL = process.env.GEMINI_DRS_MODEL ?? 'gemini-2.5-flash';
const AI_TIMEOUT_MS = Number(process.env.GEMINI_DRS_TIMEOUT_MS ?? 55_000);

const requestSchema = z.object({
  matchId: z.string().min(1),
  ballId: z.string().min(1),
  type: z.enum(['lbw', 'caught', 'runout', 'stumping', 'boundary']),
  clipPath: z.string().min(1).max(300),
});

const findingSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
  tone: z.enum(['good', 'warn', 'bad', 'muted']),
});

const aiSchema = z.object({
  findings: z.array(findingSchema).min(1).max(6),
  hitStumps: z.boolean(),
  batShortOfCreaseCm: z.number().nullable().optional(),
  contactFrame: z.number().int().nullable().optional(),
  contactConfirmed: z.boolean(),
  audioPeakAtMs: z.number().optional(),
  audioDurationMs: z.number().optional(),
  audioPeakDb: z.number().optional(),
  reason: z.string().optional(),
  trajectory: z.array(z.object({ x: z.number(), y: z.number() })).optional(),
});

type AiAnalysis = z.infer<typeof aiSchema>;

const REVIEW_TYPES: ReviewTypeId[] = ['lbw', 'caught', 'runout', 'stumping', 'boundary'];

function buildPrompt(type: ReviewTypeId): string {
  const typeGuide: Record<ReviewTypeId, string> = {
    lbw: `DECISION QUESTIONS — LBW:
      (a) Was the pitch impact IN LINE with the stumps or OUTSIDE the line?
      (b) Was the impact height above or BELOW the bails?
      (c) Projected path — was the ball HITTING, MISSING, or POSSIBLY grazing the stumps?
      Set "hitStumps": true only if the projected path clearly clips/hits the stumps.`,
    caught: `DECISION QUESTIONS — CAUGHT BEHIND:
      (a) Did the ball CLEARLY touch bat and/or gloves (edge/snick)?
      (b) Did any loud AUDIO SPIKE coincide with the bat-ball moment in the clip's audio?
      (c) Was the catch taken cleanly?
      Set "contactConfirmed": true only if there is a visible deflection on the ball OR a co-timed audio spike
      (or both). "audioPeakAtMs" = millisecond within the clip where the spike occurs, "audioPeakDb" = its
      relative loudness (negative dB, e.g. -9).`,
    runout: `DECISION QUESTIONS — RUN OUT:
      (a) When were the BAILS dislodged (millisecond + approximate frame @30fps in "contactFrame")?
      (b) Was the BAT (or any part of the batter) GROUNDED inside the crease at that moment?
      (c) Distance in cm the bat was SHORT of the crease ("batShortOfCreaseCm"); 0 if grounded in time.`,
    stumping: `DECISION QUESTIONS — STUMPING:
      (a) When did the KEEPER dislodge the bails ("contactFrame")?
      (b) Was the BAT grounded inside the crease at that exact moment?
      (c) Distance in cm the bat was out of the ground ("batShortOfCreaseCm"); 0 if grounded.`,
    boundary: `DECISION QUESTIONS — BOUNDARY:
      (a) Did the ball CROSS the boundary rope without the fielder touching it at the rope?
      (b) Was there any FIELDER CONTACT at or before the rope?
      (c) Frame at which the ball crosses the rope plane ("contactFrame").`,
  };

  return `You are a cricket third-umpire vision AI running inside Turf DRS. You are shown ONE short
video clip of a single delivery, shot from roughly the umpire's end by a phone (you may see the
bowler, batter, wicket-keeper, and maybe stumps). Timing marks in the clip run from first frame = 0ms.

Your job is to watch the video carefully — including its audio — and give the third umpire exact,
football-grade evidence for a "${type.toUpperCase()}" review.

${typeGuide[type]}

RULES:
- Present tense facts only. Never invent contact that is not visible. If the image is too blurry,
  the ball too fast, or the moment not clearly visible, say so honestly via a "muted" tone finding
  and set the relevant boolean accordingly (false unless clearly proven).
- CB — "distance from crease": a cricket stump is ~71.1cm tall and a batting crease is ~122cm wide;
  use objects in the frame to estimate cm where relevant.
- "contactFrame" is the approximate 30fps frame index (timing_ms / 33.3). If unclear, null.

Return STRICTLY this JSON schema (no markdown fences, no commentary):
{
  "findings": [ { "id": "short_slug", "label": "Human label", "value": "UPPERCASE verdict, short", "tone": "good|warn|bad|muted" } ],
  "hitStumps": true,
  "batShortOfCreaseCm": 12,
  "contactFrame": 241,
  "contactConfirmed": false,
  "audioPeakAtMs": 640,
  "audioDurationMs": 1200,
  "audioPeakDb": -9,
  "reason": "One or two sentences explaining the evidence on the clip",
  "trajectory": [ { "x": 298, "y": 84 } ]
}
Findings: use 3 stable ids where possible — for LBW: impact (pitch impact line), height (height at
impact vs bails), path (projected stumps outcome). Caught: contact, audio, frame. Run out: bail,
bat, gap. Stumping: gather, bails, bat. Boundary: rope, contact, clip. Values must be short
uppercase phrases like "IN LINE", "BELOW BAILS", "HITTING STUMPS", "POSSIBLE CONTACT", "CONFIRMED".`;
}

function mimeFor(path: string): string {
  if (path.toLowerCase().endsWith('.mp4')) return 'video/mp4';
  if (path.toLowerCase().endsWith('.mov')) return 'video/quicktime';
  return 'video/webm';
}

async function downloadClip(clipPath: string): Promise<Uint8Array> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error('Supabase admin credentials are not configured.');
  if (clipPath.includes('..')) throw new Error('invalid clip path.');
  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await admin.storage.from(CLIPS_BUCKET).download(clipPath);
  if (error || !data) throw new Error(`storage download failed: ${error?.message ?? 'no data'}`);
  return new Uint8Array(await data.arrayBuffer());
}

async function uploadToGemini(bytes: Uint8Array, mime: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  const form = new FormData();
  form.append(
    'metadata',
    JSON.stringify({ file: { display_name: `drs-clip-${Date.now()}`, mime_type: mime } }),
  );
  form.append('file', new Blob([bytes], { type: mime }), 'clip');
  const res = await fetch('https://generativelanguage.googleapis.com/upload/v1beta/files', {
    method: 'POST',
    headers: { 'x-goog-api-key': apiKey, 'X-Goog-Upload-Protocol': 'multipart' },
    body: form,
    cache: 'no-store',
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`gemini upload failed (${res.status}) ${detail.slice(0, 200)}`);
  }
  const payload = (await res.json()) as { file?: { uri?: string } };
  const fileUri = payload.file?.uri;
  if (!fileUri) throw new Error('gemini upload returned no file uri.');
  return fileUri;
}

async function analyzeWithGemini(prompt: string, fileUri: string, mime: string): Promise<AiAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured.');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${DRS_MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }, { fileData: { fileUri, mimeType: mime } }],
          },
        ],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    },
  );
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`gemini generate failed (${res.status}) ${detail.slice(0, 300)}`);
  }
  const payload = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const raw =
    payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
  if (!raw) throw new Error('gemini returned an empty response.');
  const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  return aiSchema.parse(JSON.parse(json));
}

function toEvidence(matchId: string, ballId: string, type: ReviewTypeId, ai: AiAnalysis): ReviewEvidence {
  const trajectory: TrajectoryPoint[] | undefined =
    ai.trajectory && ai.trajectory.length >= 2 ? ai.trajectory : undefined;
  const audio: AudioAnalysis | undefined =
    type === 'caught' && ai.audioPeakAtMs != null
      ? {
          sampleRate: 48_000,
          durationMs: ai.audioDurationMs ?? 1200,
          peakAtMs: ai.audioPeakAtMs,
          peakDb: ai.audioPeakDb ?? -12,
          contactConfirmed: ai.contactConfirmed,
        }
      : undefined;
  return {
    matchId,
    ballId,
    type,
    cameras: DEMO_CAMERAS,
    findings: ai.findings.map((finding): Finding => ({ ...finding })),
    impact: trajectory?.[trajectory.length - 1],
    trajectory,
    audio,
    hitStumps: ai.hitStumps,
    batShortOfCrease: ai.batShortOfCreaseCm ?? null,
    contactFrame: ai.contactFrame ?? null,
    contactConfirmed: ai.contactConfirmed,
  };
}

export async function POST(request: NextRequest) {
  const started = Date.now();
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid review request.' }, { status: 400 });
  }
  const { matchId, ballId, type, clipPath } = parsed.data;
  try {
    const bytes = await downloadClip(clipPath);
    const mime = mimeFor(clipPath);
    const fileUri = await uploadToGemini(bytes, mime);
    const ai = await analyzeWithGemini(buildPrompt(type), fileUri, mime);
    return NextResponse.json({
      evidence: toEvidence(matchId, ballId, type, ai),
      analyzedBy: 'ai',
      model: DRS_MODEL,
      latencyMs: Date.now() - started,
      reason: ai.reason ?? undefined,
    });
  } catch (error) {
    console.warn('[api/drs/analyze] falling back to simulated evidence:', (error as Error)?.message ?? error);
    const evidence = await demoService.requestEvidence({ matchId, ballId, type });
    return NextResponse.json({
      evidence,
      analyzedBy: 'simulated',
      latencyMs: Date.now() - started,
      note: 'AI analysis unavailable — showing simulated evidence for now.',
    });
  }
}