import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type StatusTone = 'emerald' | 'rose' | 'amber' | 'teal' | 'muted';

const TONES: Record<StatusTone, { pill: string; dot: string }> = {
  emerald: { pill: 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/20', dot: 'bg-emerald-400' },
  rose: { pill: 'bg-rose-500/10 text-rose-300 ring-rose-500/20', dot: 'bg-rose-500 animate-pulse' },
  amber: { pill: 'bg-amber-500/10 text-amber-300 ring-amber-500/20', dot: 'bg-amber-400' },
  teal: { pill: 'bg-teal-500/10 text-teal-300 ring-teal-500/20', dot: 'bg-teal-400' },
  muted: { pill: 'bg-foreground/[0.06] text-muted-foreground ring-foreground/10', dot: 'bg-foreground/30' },
};

export function StatusPill({
  tone,
  children,
  className,
}: {
  tone: StatusTone;
  children: ReactNode;
  className?: string;
}) {
  const styles = TONES[tone];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-widest ring-1',
        styles.pill,
        className,
      )}
    >
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', styles.dot)} />
      {children}
    </span>
  );
}