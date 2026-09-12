'use client';

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, X } from 'lucide-react';
import type { TurfActionId, TurfCommand, TurfHelpAction } from '@/lib/turf-actions';

export function HelpModal({
  open,
  command,
  onClose,
  onAction,
}: {
  open: boolean;
  command: TurfCommand | null;
  onClose: () => void;
  onAction: (id: TurfActionId) => void;
}) {
  const reduceMotion = useReducedMotion();
  const closeRef = useRef<HTMLButtonElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusables = Array.from(
        rootRef.current?.querySelectorAll<HTMLElement>('a[href], button') ?? [],
      ).filter((element) => !element.hasAttribute('disabled'));
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  const help = open && command?.kind === 'help' ? command : null;

  const renderAction = (action: TurfHelpAction) => {
    if (action.href) {
      return (
        <Link
          key={action.label}
          href={action.href}
          onClick={close}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-foreground/10 bg-transparent px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      );
    }
    return (
      <button
        key={action.label}
        type="button"
        onClick={() => {
          close();
          if (action.action) onAction(action.action);
        }}
        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-teal-500/25 transition-all hover:bg-teal-600 hover:shadow-teal-500/40"
      >
        {action.label}
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
    );
  };

  return (
    <AnimatePresence>
      {help && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 px-4 backdrop-blur-md"
          onClick={close}
        >
          <motion.div
            ref={rootRef}
            role="dialog"
            aria-modal="true"
            aria-label="Turf DRS help"
            initial={reduceMotion ? false : { opacity: 0, y: 22, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 16, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            onClick={(event) => event.stopPropagation()}
            className="glass relative w-full max-w-lg overflow-hidden rounded-3xl bg-[#0b0b14]/90 p-6 sm:p-8"
          >
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 h-56 w-96 -translate-x-1/2 rounded-full blur-[90px]"
              style={{ background: 'radial-gradient(circle, rgba(45, 212, 191, 0.16), transparent 70%)' }}
            />

            <div className="relative flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                Turf DRS Assistant
              </span>
              <button
                ref={closeRef}
                type="button"
                onClick={close}
                aria-label="Close help"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-foreground/10 text-muted-foreground transition-colors hover:border-teal-500/30 hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mt-7">
              <span className="text-xs font-medium text-muted-foreground">You asked</span>
              <p className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
                {help.question}
              </p>

              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{help.answer}</p>

              <div className="mt-6 flex flex-wrap items-center gap-2.5">
                {help.actions.map(renderAction)}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}