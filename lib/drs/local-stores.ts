'use client';

import { useCallback, useEffect, useState } from 'react';

export type StoredMatch = {
  id: string;
  title: string;
  tournament: string;
  venue: string;
  format: string;
  overs: string;
  date: string;
  team1: string;
  team2: string;
  players1: string;
  players2: string;
  camera: string;
  reviewTypes: string[];
  status: 'setup' | 'live' | 'finished';
  createdAt: number;
};

export type ClubTeam = {
  id: string;
  name: string;
  short: string;
  color: string;
  createdAt: number;
};

export type PlayerRole = 'batter' | 'bowler' | 'all-rounder' | 'keeper';

export type ClubPlayer = {
  id: string;
  name: string;
  role: PlayerRole;
  teamId: string;
  createdAt: number;
};

export type ClubSettings = {
  turfName: string;
  defaultVenue: string;
  defaultCamera: string;
  autoCapture: boolean;
  emailAlerts: boolean;
};

export const DEMO_MATCH_ENTRY: StoredMatch = {
  id: 'demo-live',
  title: 'Falcons vs Strikers',
  tournament: 'Hyderabad Turf League',
  venue: 'Hyderabad Turf Arena',
  format: 'T20',
  overs: '20',
  date: '',
  team1: 'Falcons',
  team2: 'Strikers',
  players1: 'Rohit Sharma, Virat Kohli, Rashid Khan, Pat Cummins',
  players2: 'Andre Russell, Jasprit Bumrah, Kane Williamson, Mitchell Starc',
  camera: 'umpire-end',
  reviewTypes: ['lbw', 'caught', 'runout', 'stumping', 'boundary'],
  status: 'live',
  createdAt: 0,
};

const MATCHES_KEY = 'turf-drs:matches';
const TEAMS_KEY = 'turf-drs:teams';
const PLAYERS_KEY = 'turf-drs:players';
const SETTINGS_KEY = 'turf-drs:settings';
export const LOCAL_DATA_CHANGED = 'turf-drs:local-data-changed';

export function nextId(prefix: string): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(LOCAL_DATA_CHANGED));
  }
}

/* ------------------------------- Matches -------------------------------- */

export function listMatches(): StoredMatch[] {
  return read<StoredMatch[]>(MATCHES_KEY, []);
}

export function getMatch(id: string): StoredMatch | null {
  return listMatches().find((match) => match.id === id) ?? null;
}

export function saveMatch(match: StoredMatch): void {
  const rest = listMatches().filter((item) => item.id !== match.id);
  write(MATCHES_KEY, [...rest, match]);
}

export function deleteMatch(id: string): void {
  write(MATCHES_KEY, listMatches().filter((item) => item.id !== id));
}

export function markMatchFinished(id: string): void {
  const match = getMatch(id);
  if (!match) return;
  saveMatch({ ...match, status: 'finished' });
}

/* -------------------------------- Teams --------------------------------- */

export function listTeams(): ClubTeam[] {
  return read<ClubTeam[]>(TEAMS_KEY, []);
}

export function saveTeam(team: ClubTeam): void {
  const rest = listTeams().filter((item) => item.id !== team.id);
  write(TEAMS_KEY, [...rest, team]);
}

export function deleteTeam(teamId: string): void {
  write(
    PLAYERS_KEY,
    listPlayers().filter((player) => player.teamId !== teamId),
  );
  write(TEAMS_KEY, listTeams().filter((item) => item.id !== teamId));
}

/* ------------------------------- Players -------------------------------- */

export function listPlayers(): ClubPlayer[] {
  return read<ClubPlayer[]>(PLAYERS_KEY, []);
}

export function savePlayer(player: ClubPlayer): void {
  const rest = listPlayers().filter((item) => item.id !== player.id);
  write(PLAYERS_KEY, [...rest, player]);
}

export function deletePlayer(id: string): void {
  write(PLAYERS_KEY, listPlayers().filter((item) => item.id !== id));
}

/* ------------------------------- Settings ------------------------------- */

export function defaultSettings(): ClubSettings {
  return {
    turfName: '',
    defaultVenue: 'Hyderabad Turf Arena',
    defaultCamera: 'umpire-end',
    autoCapture: true,
    emailAlerts: false,
  };
}

export function getSettings(): ClubSettings {
  return read<ClubSettings>(SETTINGS_KEY, defaultSettings());
}

export function saveSettings(settings: ClubSettings): void {
  write(SETTINGS_KEY, settings);
}

/* ------------------------------ Hooks ----------------------------------- */

function useLocalData<T>(load: () => T): T {
  const [value, setValue] = useState<T>(() => load());
  const refresh = useCallback(() => setValue(load()), [load]);
  useEffect(() => {
    refresh();
    window.addEventListener(LOCAL_DATA_CHANGED, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(LOCAL_DATA_CHANGED, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);
  return value;
}

export function useMatches(): StoredMatch[] {
  return useLocalData(listMatches);
}

export function useTeams(): ClubTeam[] {
  return useLocalData(listTeams);
}

export function usePlayers(): ClubPlayer[] {
  return useLocalData(listPlayers);
}

export function useClubSettings(): ClubSettings {
  return useLocalData(getSettings);
}