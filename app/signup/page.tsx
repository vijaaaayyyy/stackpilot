'use client';

import Link from 'next/link';
import { AuthCard } from '@/components/auth/auth-card';
import { AuthEmailForm } from '@/components/auth/auth-email-form';

export default function SignupPage() {
  return (
    <AuthCard
      eyebrow="Get started"
      title="Create your account"
      subtitle="Run matches, keep squads, and re-watch the close ones from anywhere."
      footer={
        <>
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-teal-400 hover:text-teal-300">
            Sign in
          </Link>
        </>
      }
    >
      <AuthEmailForm mode="signup" />
    </AuthCard>
  );
}
