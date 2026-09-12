'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ConnectedPulse } from '@/components/auth/connected-pulse';

function SuccessContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';

  return <ConnectedPulse next={next} />;
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={null}>
      <SuccessContent />
    </Suspense>
  );
}