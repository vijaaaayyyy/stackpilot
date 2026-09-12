import type { ReactNode } from 'react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-28 sm:px-6 sm:pt-32">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="mx-auto max-w-6xl">{children}</div>
      </div>
      <Footer />
    </main>
  );
}

export function AppSectionHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-teal-400">{eyebrow}</p>
        <h1 className="mt-2 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}