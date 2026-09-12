import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, Clapperboard, Landmark, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { CTA } from '@/components/landing/cta';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Turf DRS is free to try. Simple plans for demo users, turf owners, and leagues and academies — no credit card required.',
  alternates: { canonical: '/pricing' },
};

const plans = [
  {
    name: 'Free (Demo)',
    icon: Sparkles,
    price: '₹0',
    period: 'forever',
    description: 'Try every review live on the demo match — no setup, no card required.',
    features: [
      'Instant LBW, run out, stumping, caught & boundary reviews',
      'Live ball tracking demo',
      'Instant replay with slow motion',
      'End camera and top camera views',
      'Reviews saved on your device',
    ],
    highlighted: false,
    cta: { label: 'Run a demo review', href: '/live?demo=1' },
  },
  {
    name: 'Turf Owner',
    icon: Landmark,
    price: '₹799',
    period: 'per month',
    description: 'For turf owners running reviewable matches on their grounds.',
    features: [
      'Everything in Free (Demo)',
      'Unlimited matches at your turf',
      'Teams, players and squads',
      'Camera rig setup & calibration guide',
      'Live ball tracking on every delivery',
      'Venue profile on Turf DRS Browse',
    ],
    highlighted: true,
    cta: { label: 'Start your turf plan', href: '/signup?next=/dashboard' },
  },
  {
    name: 'League / Academy',
    icon: Clapperboard,
    price: '₹2,499',
    period: 'per month',
    description: 'For leagues and academies running decisions across many venues.',
    features: [
      'Everything in Turf Owner',
      'Multi-team fixtures and standings',
      'Reviews across all venues',
      'Umpire and coach review access',
      'Academy squad management',
      'Priority onboarding & setup help',
    ],
    highlighted: false,
    cta: { label: 'Talk to us', href: '/contact' },
  },
];

export default function PricingPage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <div className="relative overflow-hidden px-4 pb-24 pt-32 sm:px-6 sm:pt-36">
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-teal-500/10 blur-[120px]" />

        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-medium text-teal-400">Pricing</p>
          <h1 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Start <span className="gradient-text">free</span>, grow into a full review system
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Turf DRS is free to try today. Simple plans for your demo runs, your turf, or your
            whole league and academy.
          </p>
        </header>

        <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center justify-between gap-4 rounded-2xl border border-teal-500/30 bg-teal-500/[0.08] px-6 py-4 sm:flex-row">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 sm:flex">
              <Sparkles className="h-4 w-4 text-teal-400" />
            </span>
            <p className="text-sm text-muted-foreground">
              Turf DRS starts at <span className="font-semibold text-teal-300">₹0</span> — run the
              demo reviews free, upgrade when your league is ready.
            </p>
          </div>
          <Link
            href="/live?demo=1"
            className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-teal-500 px-5 text-sm font-medium text-white shadow-lg shadow-teal-500/20 transition-all hover:bg-teal-600"
          >
            Watch the live demo
          </Link>
        </div>

        <div className="mx-auto mt-16 grid max-w-5xl gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                'relative rounded-3xl p-8 transition-all hover:-translate-y-1',
                plan.highlighted
                  ? 'glass shadow-xl shadow-teal-500/10 ring-1 ring-teal-500/40'
                  : 'glass',
              )}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-teal-500 px-3 py-1 text-xs font-medium text-white">
                  Most popular
                </span>
              )}
              <div className="flex items-center gap-2">
                <plan.icon className="h-5 w-5 text-teal-400" />
                <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-semibold tracking-tight text-foreground">
                  {plan.price}
                </span>
                <span className="text-sm text-muted-foreground">{plan.period}</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {plan.description}
              </p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span
                      className={cn(
                        'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                        plan.highlighted ? 'bg-teal-500/20' : 'bg-emerald-500/15',
                      )}
                    >
                      <Check className={cn('h-2.5 w-2.5', plan.highlighted ? 'text-teal-400' : 'text-emerald-400')} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href={plan.cta.href}
                className={cn(
                  'mt-8 flex h-11 w-full items-center justify-center rounded-xl text-sm font-medium transition-all',
                  plan.highlighted
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20 hover:bg-teal-600'
                    : 'glass text-foreground hover:border-teal-500/30',
                )}
              >
                {plan.cta.label}
              </Link>
            </div>
          ))}
        </div>
      </div>
      <CTA />
      <Footer />
    </main>
  );
}