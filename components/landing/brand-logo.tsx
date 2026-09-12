import { cn } from '@/lib/utils';

/**
 * Turf DRS logo mark: a minimalist cricket ball (circle + stitched seam)
 * paired with a replay/review arrow. Original design — no ICC/IPL/Hawk-Eye.
 */
export function TurfLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className={cn('h-5 w-5', className)}>
      <circle cx="12" cy="12" r="7.6" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 4.4C9.7 6.1 9.7 9.3 11.8 12c2.1 2.7 2.1 5.9.2 7.6"
        stroke="currentColor"
        strokeWidth="1.15"
        strokeLinecap="round"
      />
      <path
        d="M19.6 12a7.6 7.6 0 0 0-4-6.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path d="M15.8 3.1 13.1 4.4l2.2 2.7Z" fill="currentColor" />
    </svg>
  );
}