'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  Gavel,
  Play,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TurfShell, TurfPageHeader } from '@/components/turf/turf-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { nextId, saveMatch, type StoredMatch } from '@/lib/drs/local-stores';

const STEPS: { id: string; label: string; icon: LucideIcon }[] = [
  { id: 'details', label: 'Match Details', icon: CalendarDays },
  { id: 'teams', label: 'Teams + Players', icon: Users },
  { id: 'umpires', label: 'Umpires', icon: UserCheck },
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'reviews', label: 'Review Types', icon: Gavel },
];

const FORMATS = ['T20', 'T10', 'ODI', 'Test', 'Custom'];
const BALL_TYPES = ['Leather · Red', 'Leather · White', 'Leather · Pink'];
const OVERS_BY_FORMAT: Record<string, number> = { T20: 20, T10: 10, ODI: 50, Test: 90, Custom: 20 };

const CAMERA_POSITIONS = [
  {
    id: 'umpire-end',
    title: 'Umpire End',
    description: 'Wide, level view of the pitch and both sets of stumps.',
    recommended: true,
  },
  {
    id: 'square-leg',
    title: 'Square Leg',
    description: 'Side angle — extra help for height and impact on LBWs.',
    recommended: false,
  },
  {
    id: 'behind-wicket',
    title: 'Behind Wicket',
    description: 'Behind the keeper — useful for edges and stumpings.',
    recommended: false,
  },
] as const;

const REVIEW_TYPES = [
  { id: 'lbw', label: 'LBW', description: 'Impact, height, and ball tracking against the stumps.' },
  { id: 'caught', label: 'Caught Behind', description: 'Edge detection from behind and square.' },
  { id: 'runout', label: 'Run Out', description: 'Timing the bails breaking against the crease.' },
  { id: 'stumping', label: 'Stumping', description: 'Keeper gathered before the bat returned.' },
  { id: 'boundary', label: 'Boundary', description: 'Ball cleanly crossing the rope.' },
] as const;

const selectClass =
  'flex h-10 w-full rounded-lg border border-foreground/10 bg-foreground/[0.03] px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/30 disabled:cursor-not-allowed disabled:opacity-50';
const inputClass =
  'border-foreground/10 bg-foreground/[0.03] text-foreground placeholder:text-muted-foreground/50';

type MatchDraft = {
  name: string;
  tournament: string;
  venue: string;
  date: string;
  format: string;
  overs: string;
  ballType: string;
};

type TeamDraft = {
  team1: string;
  team2: string;
  players1: string;
  players2: string;
};

type UmpireDraft = {
  main: string;
  third: string;
  scorer: string;
};

const DEFAULT_MATCH: MatchDraft = {
  name: '',
  tournament: 'Hyderabad Turf League',
  venue: 'Hyderabad Turf Arena',
  date: '',
  format: 'T20',
  overs: '20',
  ballType: BALL_TYPES[0],
};

const DEFAULT_TEAMS: TeamDraft = {
  team1: 'Falcons',
  team2: 'Strikers',
  players1: '',
  players2: '',
};

const DEFAULT_UMPIRES: UmpireDraft = { main: '', third: '', scorer: '' };

export default function CreateMatchPage() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [step, setStep] = useState(0);
  const [match, setMatch] = useState<MatchDraft>(DEFAULT_MATCH);
  const [teams, setTeams] = useState<TeamDraft>(DEFAULT_TEAMS);
  const [umpires, setUmpires] = useState<UmpireDraft>(DEFAULT_UMPIRES);
  const [camera, setCamera] = useState('umpire-end');
  const [reviews, setReviews] = useState<Record<string, boolean>>({
    lbw: true,
    caught: true,
    runout: true,
    stumping: true,
    boundary: true,
  });
  const [created, setCreated] = useState(false);
  const [createdMatch, setCreatedMatch] = useState<StoredMatch | null>(null);

  const isStepValid = (index: number): boolean => {
    switch (index) {
      case 0:
        return Boolean(match.name.trim() && match.venue.trim() && match.date.trim());
      case 1:
        return Boolean(teams.team1.trim() && teams.team2.trim());
      case 2:
        return Boolean(umpires.main.trim());
      case 3:
        return camera.length > 0;
      case 4:
        return Object.values(reviews).some(Boolean);
      default:
        return true;
    }
  };

  const enabledReviewTypes = REVIEW_TYPES.filter((type) => reviews[type.id]);

  const buildMatch = (): StoredMatch => ({
    id: nextId('match'),
    title: match.name.trim() || `${teams.team1.trim()} vs ${teams.team2.trim()}`,
    tournament: match.tournament.trim() || 'Turf League',
    venue: match.venue.trim() || 'Turf Arena',
    format: match.format,
    overs: match.overs,
    date: match.date,
    team1: teams.team1.trim(),
    team2: teams.team2.trim(),
    players1: teams.players1.trim(),
    players2: teams.players2.trim(),
    camera,
    reviewTypes: enabledReviewTypes.map((type) => type.id),
    status: 'live',
    createdAt: Date.now(),
  });

  const openLive = (match: StoredMatch) => {
    const query = new URLSearchParams({
      match: match.id,
      title: match.title,
      tournament: match.tournament,
    });
    router.push(`/live?${query.toString()}`);
  };

  const handleStart = () => {
    const match = buildMatch();
    saveMatch(match);
    setCreated(true);
    setCreatedMatch(match);
  };

  const next = () => setStep((value) => Math.min(value + 1, STEPS.length - 1));
  const back = () => setStep((value) => Math.max(value - 1, 0));
  const isLast = step === STEPS.length - 1;

  return (
    <TurfShell>
      <TurfPageHeader
        eyebrow="Create Match"
        title="Set up a new match"
        description="Five quick steps — teams, umpires, camera, and reviews. Turf DRS starts auto-capturing from the first ball."
      />

      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="mx-auto mt-12 max-w-2xl">
        <div className="relative overflow-hidden rounded-2xl border border-foreground/10 bg-[#0b0b14]/90 px-6 py-8 shadow-xl shadow-black/30 sm:px-8 sm:py-10">
          <span
            aria-hidden="true"
            className="absolute inset-x-4 top-0 h-px bg-gradient-to-r from-transparent via-teal-500/60 to-transparent"
          />

          {!created ? (
            <>
              {/* Stepper */}
              <ol className="flex">
                {STEPS.map((item, index) => {
                  const Icon = item.icon;
                  const isDone = index < step;
                  const isActive = index === step;
                  const isReachable = index <= step || isStepValid(step);
                  return (
                    <li key={item.id} className="relative flex flex-1 flex-col items-center">
                      {index < STEPS.length - 1 && (
                        <span
                          aria-hidden="true"
                          className={cn(
                            'absolute top-[18px] h-px w-full transition-colors duration-300',
                            index < step ? 'bg-teal-500/40' : 'bg-foreground/10',
                          )}
                          style={{ left: '50%' }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (isReachable) setStep(index);
                        }}
                        disabled={!isReachable}
                        aria-current={isActive ? 'step' : undefined}
                        className="group relative z-10 flex flex-col items-center gap-2 px-1 disabled:cursor-not-allowed"
                      >
                        <span
                          className={cn(
                            'flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300',
                            isDone &&
                              'border-teal-500/60 bg-teal-500 text-white shadow-lg shadow-teal-500/25',
                            isActive &&
                              'border-teal-500/50 bg-teal-500/10 text-teal-300 ring-2 ring-teal-500/25',
                            !isDone && !isActive &&
                              'border-foreground/10 bg-foreground/[0.03] text-muted-foreground',
                            isActive || isDone ? '' : 'group-hover:border-teal-500/25',
                          )}
                        >
                          {isDone ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Icon className="h-4 w-4" />
                          )}
                        </span>
                        <span
                          className={cn(
                            'hidden pb-1 text-center text-[10px] font-medium leading-tight sm:block',
                            isActive || isDone ? 'text-foreground' : 'text-muted-foreground',
                          )}
                        >
                          {item.label}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>

              {/* Step content */}
              <div className="relative mt-9 min-h-[340px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={reduceMotion ? false : { opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0, x: -24 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                  >
                    {/* Step 1 — Match Details */}
                    {step === 0 && (
                      <div className="space-y-5">
                        <div>
                          <Label htmlFor="match-name" className="mb-1.5 text-xs text-muted-foreground">
                            Match name
                          </Label>
                          <Input
                            id="match-name"
                            value={match.name}
                            onChange={(e) => setMatch({ ...match, name: e.target.value })}
                            placeholder="Falcons vs Strikers"
                            className={inputClass}
                            required
                          />
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="tournament" className="mb-1.5 text-xs text-muted-foreground">
                              Tournament / League
                            </Label>
                            <Input
                              id="tournament"
                              value={match.tournament}
                              onChange={(e) => setMatch({ ...match, tournament: e.target.value })}
                              placeholder="Hyderabad Turf League"
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <Label htmlFor="venue" className="mb-1.5 text-xs text-muted-foreground">
                              Venue
                            </Label>
                            <Input
                              id="venue"
                              value={match.venue}
                              onChange={(e) => setMatch({ ...match, venue: e.target.value })}
                              placeholder="Hyderabad Turf Arena"
                              className={inputClass}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="date" className="mb-1.5 text-xs text-muted-foreground">
                              Date
                            </Label>
                            <Input
                              id="date"
                              type="date"
                              value={match.date}
                              onChange={(e) => setMatch({ ...match, date: e.target.value })}
                              className={inputClass}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="format" className="mb-1.5 text-xs text-muted-foreground">
                              Format
                            </Label>
                            <select
                              id="format"
                              value={match.format}
                              onChange={(e) => {
                                const format = e.target.value;
                                setMatch({ ...match, format, overs: String(OVERS_BY_FORMAT[format] ?? match.overs) });
                              }}
                              className={selectClass}
                            >
                              {FORMATS.map((format) => (
                                <option key={format} value={format}>
                                  {format}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="overs" className="mb-1.5 text-xs text-muted-foreground">
                              Overs per innings
                            </Label>
                            <Input
                              id="overs"
                              type="number"
                              min={1}
                              max={90}
                              value={match.overs}
                              onChange={(e) => setMatch({ ...match, overs: e.target.value })}
                              className={inputClass}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="ball-type" className="mb-1.5 text-xs text-muted-foreground">
                              Ball type
                            </Label>
                            <select
                              id="ball-type"
                              value={match.ballType}
                              onChange={(e) => setMatch({ ...match, ballType: e.target.value })}
                              className={selectClass}
                            >
                              {BALL_TYPES.map((ball) => (
                                <option key={ball} value={ball}>
                                  {ball}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 2 — Teams + Players */}
                    {step === 1 && (
                      <div className="space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="team1" className="mb-1.5 text-xs text-muted-foreground">
                              Team 1 name
                            </Label>
                            <Input
                              id="team1"
                              value={teams.team1}
                              onChange={(e) => setTeams({ ...teams, team1: e.target.value })}
                              placeholder="Falcons"
                              className={inputClass}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="team2" className="mb-1.5 text-xs text-muted-foreground">
                              Team 2 name
                            </Label>
                            <Input
                              id="team2"
                              value={teams.team2}
                              onChange={(e) => setTeams({ ...teams, team2: e.target.value })}
                              placeholder="Strikers"
                              className={inputClass}
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="players1" className="mb-1.5 text-xs text-muted-foreground">
                            {teams.team1 || 'Team 1'} — players
                          </Label>
                          <Input
                            id="players1"
                            value={teams.players1}
                            onChange={(e) => setTeams({ ...teams, players1: e.target.value })}
                            placeholder="Rohit, Virat, Rashid, Pat… (optional)"
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <Label htmlFor="players2" className="mb-1.5 text-xs text-muted-foreground">
                            {teams.team2 || 'Team 2'} — players
                          </Label>
                          <Input
                            id="players2"
                            value={teams.players2}
                            onChange={(e) => setTeams({ ...teams, players2: e.target.value })}
                            placeholder="Andre, Jasprit, Kane, Mitchell… (optional)"
                            className={inputClass}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground/70">
                          Player lists are optional — Turf DRS works fine with just team names. You
                          can edit players from the Teams page later.
                        </p>
                      </div>
                    )}

                    {/* Step 3 — Umpires */}
                    {step === 2 && (
                      <div className="space-y-5">
                        <div>
                          <Label htmlFor="umpire-main" className="mb-1.5 text-xs text-muted-foreground">
                            Main umpire
                          </Label>
                          <Input
                            id="umpire-main"
                            value={umpires.main}
                            onChange={(e) => setUmpires({ ...umpires, main: e.target.value })}
                            placeholder="Umpire name"
                            className={inputClass}
                            required
                          />
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                          <div>
                            <Label htmlFor="umpire-third" className="mb-1.5 text-xs text-muted-foreground">
                              Third umpire
                            </Label>
                            <Input
                              id="umpire-third"
                              value={umpires.third}
                              onChange={(e) => setUmpires({ ...umpires, third: e.target.value })}
                              placeholder="Turf DRS (auto)"
                              className={inputClass}
                            />
                            <p className="mt-1 text-[10px] text-muted-foreground/60">
                              Leave empty to let Turf DRS act as the third umpire.
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="umpire-scorer" className="mb-1.5 text-xs text-muted-foreground">
                              Scorer
                            </Label>
                            <Input
                              id="umpire-scorer"
                              value={umpires.scorer}
                              onChange={(e) => setUmpires({ ...umpires, scorer: e.target.value })}
                              placeholder="Scorer name (optional)"
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Step 4 — Camera */}
                    {step === 3 && (
                      <div className="space-y-4">
                        {CAMERA_POSITIONS.map((position) => {
                          const Icon = position.recommended ? Camera : UserCheck;
                          const isSelected = camera === position.id;
                          return (
                            <button
                              key={position.id}
                              type="button"
                              onClick={() => setCamera(position.id)}
                              aria-pressed={isSelected}
                              className={cn(
                                'group w-full rounded-xl border px-4 py-3.5 text-left transition-all',
                                isSelected
                                  ? 'border-teal-500/40 bg-teal-500/[0.06] ring-1 ring-teal-500/25'
                                  : 'border-foreground/10 bg-foreground/[0.02] hover:border-teal-500/25',
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <span
                                  className={cn(
                                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
                                    isSelected
                                      ? 'bg-teal-500/15 text-teal-300 ring-1 ring-teal-500/25'
                                      : 'bg-foreground/[0.04] text-muted-foreground',
                                  )}
                                >
                                  <Icon className="h-4 w-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                                    {position.title}
                                    {position.recommended && (
                                      <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[10px] font-medium text-teal-400">
                                        Recommended
                                      </span>
                                    )}
                                  </p>
                                  <p className="mt-0.5 text-xs text-muted-foreground">
                                    {position.description}
                                  </p>
                                </div>
                                <span
                                  aria-hidden="true"
                                  className={cn(
                                    'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all',
                                    isSelected
                                      ? 'border-teal-400 bg-teal-500'
                                      : 'border-foreground/20 bg-transparent',
                                  )}
                                >
                                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                        <p className="rounded-lg border border-foreground/5 bg-foreground/[0.02] px-3 py-2 text-xs text-muted-foreground">
                          Umpire End is the default and only required camera. Square-leg and
                          behind-the-wicket angles are optional extras for better evidence.
                        </p>
                      </div>
                    )}

                    {/* Step 5 — Review Types */}
                    {step === 4 && (
                      <div className="space-y-3">
                        {REVIEW_TYPES.map((type) => {
                          const enabled = reviews[type.id];
                          return (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => setReviews({ ...reviews, [type.id]: !enabled })}
                              aria-pressed={enabled}
                              className={cn(
                                'flex w-full items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all',
                                enabled
                                  ? 'border-teal-500/40 bg-teal-500/[0.06] ring-1 ring-teal-500/25'
                                  : 'border-foreground/10 bg-foreground/[0.02] opacity-55 hover:opacity-90',
                              )}
                            >
                              <span
                                aria-hidden="true"
                                className={cn(
                                  'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all',
                                  enabled ? 'border-teal-400 bg-teal-500' : 'border-foreground/20',
                                )}
                              >
                                {enabled && <Check className="h-3 w-3 text-white" />}
                              </span>
                              <span>
                                <span className="block text-sm font-medium text-foreground">
                                  {type.label}
                                </span>
                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                  {type.description}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Step footer actions */}
              <div className="relative mt-8 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={back}
                  disabled={step === 0}
                  className="h-11 rounded-xl border-foreground/10 bg-transparent px-5 text-foreground hover:bg-foreground/5 disabled:opacity-40"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>

                {isLast ? (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 rounded-xl border-teal-500/30 bg-teal-500/10 px-5 text-teal-300 hover:bg-teal-500/15"
                    >
                      <Link href="/live?demo=1">
                        <Play className="mr-2 h-4 w-4" />
                        Start Demo Match
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      onClick={handleStart}
                      disabled={!isStepValid(step)}
                      className="h-11 rounded-xl bg-teal-500 px-5 text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40 disabled:opacity-40"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Start Match
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={next}
                    disabled={!isStepValid(step)}
                    className="h-11 rounded-xl bg-teal-500 px-5 text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40 disabled:opacity-40"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="relative flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-500/25">
                <CheckCircle2 className="h-7 w-7 text-emerald-400" />
              </span>
              <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
                Match created
              </h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                {match.name || `${teams.team1} vs ${teams.team2}`} · {match.format} · {match.overs}{' '}
                overs · {match.venue}
              </p>
              <p className="mt-2 text-xs text-muted-foreground/60">
                {enabledReviewTypes.length} review types armed · Auto-capture starts from the first
                ball.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={() => createdMatch && openLive(createdMatch)}
                  className="h-11 rounded-xl bg-teal-500 px-7 text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40"
                >
                  Open Live Match
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setCreated(false);
                    setCreatedMatch(null);
                    setMatch(DEFAULT_MATCH);
                    setTeams(DEFAULT_TEAMS);
                    setUmpires(DEFAULT_UMPIRES);
                    setStep(0);
                  }}
                  className="h-11 rounded-xl border-foreground/10 bg-transparent px-7 text-foreground hover:bg-foreground/5"
                >
                  Create another match
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

    </TurfShell>
  );
}