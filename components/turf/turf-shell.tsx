import type { ReactNode } from 'react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { CTA } from '@/components/landing/cta';

export function TurfShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-20 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />
        <div className="mx-auto max-w-5xl">{children}</div>
      </div>
      <CTA />
      <Footer />
    </main>
  );
}

export function TurfPageHeader({
  eyebrow,
  title,
  highlight,
  description,
}: {
  eyebrow: string;
  title: string;
  highlight?: string;
  description: string;
}) {
  return (
    <header className="mx-auto max-w-3xl text-center">
      <p className="text-sm font-medium text-teal-400">{eyebrow}</p>
      <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
        {title}
        {highlight ? <span className="gradient-text"> {highlight}</span> : null}
      </h1>
      <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
        {description}
      </p>
    </header>
  );
}