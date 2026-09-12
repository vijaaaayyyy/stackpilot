'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Trash2, UserRound } from 'lucide-react';
import {
  deletePlayer,
  nextId,
  savePlayer,
  usePlayers,
  useTeams,
  type PlayerRole,
} from '@/lib/drs/local-stores';
import { AppShell, AppSectionHeader } from '@/components/turf/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ROLES: { id: PlayerRole; label: string }[] = [
  { id: 'batter', label: 'Batter' },
  { id: 'bowler', label: 'Bowler' },
  { id: 'all-rounder', label: 'All-rounder' },
  { id: 'keeper', label: 'Keeper' },
];

export default function PlayersPage() {
  const players = usePlayers();
  const teams = useTeams();
  const [name, setName] = useState('');
  const [role, setRole] = useState<PlayerRole>('batter');
  const [teamId, setTeamId] = useState<string>(teams[0]?.id ?? '');
  const [saved, setSaved] = useState(false);

  const teamById = (id: string) => teams.find((team) => team.id === id);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    savePlayer({
      id: nextId('player'),
      name: trimmed,
      role,
      teamId,
      createdAt: Date.now(),
    });
    setName('');
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <AppSectionHeader eyebrow="Turf DRS · Roster" title="Players" />

        <section className="space-y-4">
          <div className="glass max-w-xl rounded-2xl p-6">
            <form onSubmit={submit} className="space-y-4">
              <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                <UserRound className="h-4 w-4" /> Add a player
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="player-name">Player name</Label>
                  <Input
                    id="player-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="e.g. Rohit Sharma"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="player-team">Team</Label>
                  <select
                    id="player-team"
                    value={teamId}
                    onChange={(event) => setTeamId(event.target.value)}
                    className={selectClass}
                    required
                  >
                    {teams.length === 0 && <option value="">Add a team first</option>}
                    {teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <div className="flex flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={cnRole(role === r.id)}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                type="submit"
                disabled={teams.length === 0}
                className="rounded-xl bg-teal-500 text-white hover:bg-teal-600 disabled:opacity-40"
              >
                {saved ? 'Saved' : 'Add player'}
              </Button>
            </form>
          </div>

          <div className="space-y-3">
            {players.length > 0 ? (
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {players.map((player) => {
                  const team = teamById(player.teamId);
                  return (
                    <li
                      key={player.id}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-foreground/5 bg-foreground/[0.02] px-5 py-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-sm font-bold text-teal-300 ring-1 ring-teal-500/20">
                          {player.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-foreground">{player.name}</p>
                          <p className="text-xs capitalize text-muted-foreground">
                            {player.role}
                            {team ? ` · ${team.name}` : ''}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        className="px-2 text-muted-foreground hover:text-rose-400"
                        onClick={() => deletePlayer(player.id)}
                        aria-label={`Delete ${player.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="glass rounded-2xl p-6">
                <p className="text-sm text-muted-foreground">
                  No players yet. Add a team first, then build your rosters here.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

const selectClass =
  'w-full rounded-lg border border-foreground/10 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-500/50';

function cnRole(active: boolean): string {
  return `rounded-lg px-3 py-1.5 text-xs font-medium ring-1 transition-all ${
    active
      ? 'bg-teal-500/15 text-teal-300 ring-teal-500/30'
      : 'bg-transparent text-muted-foreground ring-foreground/10 hover:text-foreground'
  }`;
}