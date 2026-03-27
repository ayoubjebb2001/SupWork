'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import type { Paginated, Ticket } from '@/types/ticket';
import { ticketId } from '@/types/ticket';

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

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'AGENT') {
      router.replace('/login');
      return;
    }
    Promise.all([
      apiFetch<Paginated<Ticket>>(`/tickets/agent/me?page=1&limit=50`),
      apiFetch(`/stats/agent/me`),
    ])
      .then(([t, s]) => {
        setData(t);
        setStats(s as typeof stats);
      })
      .catch((e: Error) => setError(e.message));
  }, [user, ready, router]);

  if (!ready || !user) {
    return (
      <div className="layout">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="layout">
      <h1>Assigned tickets</h1>
      {stats && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <strong>Your stats</strong>
          <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
            Active: {stats.assignedActive} · Resolved: {stats.resolvedCount}
            {stats.averageResolutionMs != null
              ? ` · Avg resolution: ${Math.round(stats.averageResolutionMs / 3600000)}h`
              : ''}
          </p>
        </div>
      )}
      {error ? <p className="error">{error}</p> : null}
      {data && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((t) => (
                <tr key={ticketId(t)}>
                  <td>
                    <Link href={`/agent/ticket/${ticketId(t)}`}>
                      {t.title}
                    </Link>
                  </td>
                  <td>{t.status}</td>
                  <td>{t.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
