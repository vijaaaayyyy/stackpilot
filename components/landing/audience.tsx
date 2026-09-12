'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Home, Trophy, UserCheck, Users } from 'lucide-react';

const audiences = [
  {
    icon: Home,
    title: 'For Turf Owners',
    description: 'Turn your ground into a professional review facility and stand out to every team in the city.',
    gradient: 'from-teal-500 to-cyan-500',
    iconColor: 'text-teal-300',
    tint: 'bg-teal-500/10',
  },
  {
    icon: UserCheck,
    title: 'For Umpires',
    description: 'Make the right call every time with slow-mo, ball tracking, and frame-by-frame evidence.',
    gradient: 'from-emerald-500 to-teal-500',
    iconColor: 'text-emerald-300',
    tint: 'bg-emerald-500/10',
  },
  {
    icon: Users,
    title: 'For Players',
    description: 'Your best moments, controversial calls, and nets sessions — always captured and reviewable.',
    gradient: 'from-indigo-500 to-blue-500',
    iconColor: 'text-indigo-300',
    tint: 'bg-indigo-500/10',
  },
  {
    icon: Trophy,
    title: 'For Local Leagues',
    description: 'Cup finals, league matches, and academy showcases with broadcast-quality reviews.',
    gradient: 'from-amber-500 to-orange-500',
    iconColor: 'text-amber-300',
    tint: 'bg-amber-500/10',
  },
];

export function Audience() {
  const reduceMotion = useReducedMotion();
  return (
    <section id="audience" className="relative py-24 sm:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[140px]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-medium text-teal-400">Who it&apos;s for</p>
          <h2 className="mt-3 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Built for every <span className="gradient-text">side of the turf</span>
          </h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            From turf owners and umpires to players and local leagues — Turf DRS fits the whole
            cricket family.
          </p>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {audiences.map((audience, index) => (
            <motion.div
              key={audience.title}
              initial={reduceMotion ? false : { opacity: 0, y: 28 }}
              whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: (index % 4) * 0.08, ease: 'easeOut' }}
            >
              <div className="group relative h-full overflow-hidden rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:shadow-indigo-500/10">
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />
                <div
                  aria-hidden="true"
                  className={`pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-gradient-to-br ${audience.gradient} opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-20`}
                />
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${audience.tint} ring-1 ring-foreground/10 transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <audience.icon className={`h-6 w-6 ${audience.iconColor}`} />
                </div>
                <h3 className="mt-5 text-base font-semibold tracking-tight text-foreground">
                  {audience.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {audience.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}