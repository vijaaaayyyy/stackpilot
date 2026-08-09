'use client';

import { useEffect } from 'react';
import { toast } from 'sonner';

export function PricingFreeTip() {
  useEffect(() => {
    const id = window.setTimeout(() => {
      toast('Psst… everything is free right now.', {
        description: 'Build your stack for $0 — no credit card needed.',
        duration: 7000,
      });
    }, 1200);
    return () => window.clearTimeout(id);
  }, []);

  return null;
}
