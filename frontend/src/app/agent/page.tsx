'use client';

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
import { StatCard } from '@/components/ui/StatCard';

export default function AgentInboxPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Paginated<Ticket> | null>(null);
  const [stats, setStats] = useState<{
    assignedActive: number;
    resolvedCount: number;
    averageResolutionMs: number | null;
  } | null>(null);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'AGENT') {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    setError('');
    Promise.all([
      apiFetch<Paginated<Ticket>>(`/tickets/agent/me?page=1&limit=50`),
      apiFetch(`/stats/agent/me`),
    ])
      .then(([t, s]) => {
        if (!cancelled) {
          setData(t);
          setStats(s as typeof stats);
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
        title="Assigned tickets"
        description="Tickets currently assigned to you."
      />
      {error ? (
        <ErrorBanner message={error} onRetry={() => setRetryKey((k) => k + 1)} />
      ) : null}
      {stats ? (
        <StatCard title="Your workload">
          <div className="metric-row">
            <div className="metric">
              <div className="metric__value">{stats.assignedActive}</div>
              <div className="metric__label">Active</div>
            </div>
            <div className="metric">
              <div className="metric__value">{stats.resolvedCount}</div>
              <div className="metric__label">Resolved</div>
            </div>
            {stats.averageResolutionMs != null ? (
              <div className="metric">
                <div className="metric__value">
                  {Math.round(stats.averageResolutionMs / 3600000)}h
                </div>
                <div className="metric__label">Avg resolution</div>
              </div>
            ) : null}
          </div>
        </StatCard>
      ) : null}
      {data ? (
        <TicketListTable
          tickets={data.data}
          basePath="/agent/ticket"
          emptyTitle="Inbox is clear"
          emptyHint="When tickets are assigned to you, they will appear here."
        />
      ) : !error ? (
        <LoadingState label="Loading inbox…" />
      ) : null}
    </PageShell>
  );
}
