'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Camera, Check, Database, RefreshCcw, Settings2, Trash2 } from 'lucide-react';
import { useReviews } from '@/lib/drs/store';
import {
  deleteMatch,
  getSettings,
  saveSettings,
  useMatches,
  type ClubSettings,
} from '@/lib/drs/local-stores';
import { AppShell, AppSectionHeader } from '@/components/turf/app-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CAMERA_OPTIONS = ['umpire-end', 'behind-wicket', 'square-leg'];

export default function SettingsPage() {
  const [settings, setSettings] = useState<ClubSettings>(getSettings());
  const [saved, setSaved] = useState(false);
  const { reset } = useReviews();
  const matches = useMatches();
  const createdMatches = matches.filter((match) => match.id !== 'demo-live');

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const update = <K extends keyof ClubSettings>(key: K, value: ClubSettings[K]) => {
    setSettings({ ...settings, [key]: value });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveSettings(settings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <AppSectionHeader eyebrow="Turf DRS · Preferences" title="Settings" />

        <form onSubmit={submit} className="space-y-6">
          <section className="glass space-y-4 rounded-2xl p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Settings2 className="h-4 w-4" /> Club
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="turf-name">Turf / club name</Label>
                <Input
                  id="turf-name"
                  value={settings.turfName}
                  onChange={(event) => update('turfName', event.target.value)}
                  placeholder="e.g. Hyderabad Turf Club"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venue">Default venue</Label>
                <Input
                  id="venue"
                  value={settings.defaultVenue}
                  onChange={(event) => update('defaultVenue', event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="camera">Primary camera position</Label>
              <select
                id="camera"
                value={settings.defaultCamera}
                onChange={(event) => update('defaultCamera', event.target.value)}
                className={selectClass}
              >
                {CAMERA_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </section>

          <section className="glass space-y-4 rounded-2xl p-6">
            <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Camera className="h-4 w-4" /> Automation
            </h2>
            <Toggle
              label="Auto-capture impact frames on review"
              hint="Frozen frame recorded when a review is requested."
              checked={settings.autoCapture}
              onChange={(value) => update('autoCapture', value)}
            />
            <Toggle
              label="Email review summaries"
              hint="Get your decision report after each match."
              checked={settings.emailAlerts}
              onChange={(value) => update('emailAlerts', value)}
            />
          </section>

          <Button type="submit" className="rounded-xl bg-teal-500 text-white hover:bg-teal-600">
            {saved ? (
              <>
                <Check className="h-4 w-4" /> Saved
              </>
            ) : (
              'Save settings'
            )}
          </Button>
        </form>

        <section className="space-y-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            <Database className="h-4 w-4" /> Local data
          </h2>
          <div className="glass space-y-4 rounded-2xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Clear review history</p>
                <p className="text-xs text-muted-foreground">
                  Removes saved review records from this device and the database.
                </p>
              </div>
              <Button
                variant="outline"
                className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                onClick={async () => reset()}
              >
                <Trash2 className="h-4 w-4" /> Clear reviews
              </Button>
            </div>
            {createdMatches.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-foreground/5 pt-4">
                <div>
                  <p className="text-sm font-medium text-foreground">Delete created matches</p>
                  <p className="text-xs text-muted-foreground">
                    Removes {createdMatches.length} saved match
                    {createdMatches.length === 1 ? '' : 'es'} from this device.
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="border-rose-500/30 text-rose-300 hover:bg-rose-500/10"
                  onClick={() => createdMatches.forEach((match) => deleteMatch(match.id))}
                >
                  <RefreshCcw className="h-4 w-4" /> Remove matches
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Toggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-teal-500' : 'bg-foreground/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
}

const selectClass =
  'w-full rounded-lg border border-foreground/10 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors focus:border-teal-500/50';