'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import type { Paginated, Ticket } from '@/types/ticket';
import { TicketListTable } from '@/components/tickets/TicketListTable';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { LoadingState } from '@/components/ui/LoadingState';

export default function ClientTicketsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Paginated<Ticket> | null>(null);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'CLIENT') {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    setError('');
    apiFetch<Paginated<Ticket>>(`/tickets/client/${user.sub}?page=1&limit=50`)
      .then((d) => {
        if (!cancelled) {
          setData(d);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, ready, router, retryKey]);

  if (!ready || !user) {
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="My tickets"
        meta={
          <Link href="/client/new" style={{ fontWeight: 600 }}>
            Create a ticket
          </Link>
        }
      />
      {error ? (
        <ErrorBanner message={error} onRetry={() => setRetryKey((k) => k + 1)} />
      ) : null}
      {data ? (
        <>
          <TicketListTable
            tickets={data.data}
            basePath="/client/ticket"
            emptyTitle="No tickets yet"
            emptyHint={
              <>
                When you create a ticket, it will show up here.{' '}
                <Link href="/client/new">Create your first ticket</Link>.
              </>
            }
          />
          <p className="text-muted" style={{ marginTop: 'var(--space-3)' }}>
            {data.total} total
          </p>
        </>
      ) : !error ? (
        <LoadingState label="Loading tickets…" />
      ) : null}
    </PageShell>
  );
}
