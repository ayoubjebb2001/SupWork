'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { PageShell } from '@/components/ui/PageShell';
import { LoadingState } from '@/components/ui/LoadingState';

export default function HomePage() {
  const { user, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'ADMIN') {
      router.replace('/admin');
    } else if (user.role === 'AGENT') {
      router.replace('/agent');
    } else {
      router.replace('/client');
    }
  }, [user, ready, router]);

  return (
    <PageShell>
      <LoadingState />
    </PageShell>
  );
}
