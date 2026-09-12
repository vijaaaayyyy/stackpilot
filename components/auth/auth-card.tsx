'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { TurfLogo } from '@/components/landing/brand-logo';
import { cn } from '@/lib/utils';

export function AuthCard({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  className,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[420px] w-[680px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
      <div className={cn('w-full max-w-md', className)}>
        <div className="mb-8 flex flex-col items-center text-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-500 text-white shadow-lg shadow-teal-500/25">
              <TurfLogo className="h-5 w-5" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Turf <span className="gradient-text">DRS</span>
            </span>
          </Link>
        </div>

        <div className="glass rounded-2xl p-8">
          <p className="text-xs font-medium uppercase tracking-wide text-teal-400">{eyebrow}</p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>

        {footer && (
          <p className="mt-5 text-center text-sm text-muted-foreground">{footer}</p>
        )}
      </div>
    </main>
  );
}
