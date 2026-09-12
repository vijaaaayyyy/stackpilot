'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus, Trash2, Trophy } from 'lucide-react';
import {
  deleteTeam,
  listPlayers,
  nextId,
  saveTeam,
  useTeams,
} from '@/lib/drs/local-stores';
import { AppShell, AppSectionHeader } from '@/components/turf/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const TEAM_COLORS = ['#0ea5a0', '#f59e0b', '#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#f87171', '#60a5fa'];

export default function TeamsPage() {
  const teams = useTeams();
  const [name, setName] = useState('');
  const [short, setShort] = useState('');
  const [color, setColor] = useState(TEAM_COLORS[0]);
  const [saved, setSaved] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    saveTeam({
      id: nextId('team'),
      name: trimmed,
      short: short.trim().slice(0, 4).toUpperCase() || 'TURF',
      color,
      createdAt: Date.now(),
    });
    setName('');
    setShort('');
    setColor(TEAM_COLORS[0]);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <AppSectionHeader eyebrow="Turf DRS · Sides" title="Teams" />

        <section className="space-y-4">
          <div className="glass max-w-xl rounded-2xl p-6">
            <form onSubmit={submit} className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <Plus className="h-4 w-4" /> Add a team
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="team-name">Team name</Label>
                  <Input
                    id="team-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Falcons"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="team-short">Short name</Label>
                  <Input
                    id="team-short"
                    value={short}
                    onChange={(event) => setShort(event.target.value)}
                    placeholder="e.g. FAL"
                    maxLength={4}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {TEAM_COLORS.map((tone) => (
                    <button
                      key={tone}
                      type="button"
                      onClick={() => setColor(tone)}
                      aria-label={`Pick color ${tone}`}
                      className={cnColor(tone, color === tone)}
                    >
                      <span
                        className="block h-6 w-6 rounded-full"
                        style={{ backgroundColor: tone }}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Button type="submit" className="rounded-xl bg-teal-500 text-white hover:bg-teal-600">
                {saved ? 'Saved' : 'Add team'}
              </Button>
            </form>
          </div>

          <div className="space-y-3">
            {teams.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {teams.map((team) => {
                  const count = listPlayers().filter((player) => player.teamId === team.id).length;
                  return (
                    <li
                      key={team.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-foreground/5 bg-foreground/[0.02] px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.short.slice(0, 1)}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{team.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {team.short} · {count} {count === 1 ? 'player' : 'players'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="px-2 text-muted-foreground hover:text-rose-400"
                        onClick={() => deleteTeam(team.id)}
                        aria-label={`Delete ${team.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="glass flex flex-col items-start gap-3 rounded-2xl p-6">
                <Trophy className="h-6 w-6 text-teal-300" />
                <p className="text-sm text-muted-foreground">
                  No teams yet. Add your turf sides above — they&apos;ll be available when you
                  create a match.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function cnColor(tone: string, active: boolean): string {
  return `rounded-full p-1 ring-2 transition-all ${active ? 'ring-teal-400 brightness-110' : 'ring-transparent hover:ring-foreground/20'}`;
}