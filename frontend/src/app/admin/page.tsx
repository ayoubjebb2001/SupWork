'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import type { Paginated, Ticket } from '@/types/ticket';
import { ticketId } from '@/types/ticket';

export default function AdminDashboardPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Paginated<Ticket> | null>(null);
  const [globalStats, setGlobalStats] = useState<{
    countByStatus: Record<string, number>;
    totalTickets: number;
    averageResolutionMs: number | null;
  } | null>(null);
  const [agents, setAgents] = useState<
    {
      agentId: string;
      resolvedCount: number;
      averageResolutionMs: number | null;
    }[]
  >([]);
  const [assignTicketId, setAssignTicketId] = useState('');
  const [assignAgentId, setAssignAgentId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'ADMIN') {
      router.replace('/login');
      return;
    }
    Promise.all([
      apiFetch<Paginated<Ticket>>(`/tickets/admin?page=1&limit=30`),
      apiFetch(`/stats/admin`),
      apiFetch(`/stats/admin/agents`),
    ])
      .then(([t, g, a]) => {
        setTickets(t);
        setGlobalStats(g as typeof globalStats);
        setAgents(a as typeof agents);
      })
      .catch((e: Error) => setError(e.message));
  }, [user, ready, router]);

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    await apiFetch(`/tickets/admin/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ticketId: assignTicketId,
        agentId: assignAgentId,
      }),
    });
    setAssignTicketId('');
    setAssignAgentId('');
    const t = await apiFetch<Paginated<Ticket>>(`/tickets/admin?page=1&limit=30`);
    setTickets(t);
  }

  if (!ready || !user) {
    return (
      <div className="layout">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <div className="layout">
      <h1>Admin</h1>
      <p>
        <Link href="/admin/users">Users</Link>
        {' · '}
        <Link href="/audit/logs">Audit log</Link>
      </p>
      {globalStats && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <strong>Global</strong>
          <p style={{ color: 'var(--muted)' }}>
            Total: {globalStats.totalTickets} · OPEN:{' '}
            {globalStats.countByStatus['OPEN'] ?? 0} · IN_PROGRESS:{' '}
            {globalStats.countByStatus['IN_PROGRESS'] ?? 0} · RESOLVED:{' '}
            {globalStats.countByStatus['RESOLVED'] ?? 0}
            {globalStats.averageResolutionMs != null
              ? ` · Avg resolution: ${Math.round(globalStats.averageResolutionMs / 3600000)}h`
              : ''}
          </p>
        </div>
      )}
      {agents.length > 0 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <strong>Agents (resolved)</strong>
          <ul>
            {agents.slice(0, 8).map((a) => (
              <li key={a.agentId}>
                {a.agentId}: {a.resolvedCount} resolved
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h2>Assign ticket</h2>
        <form onSubmit={assign}>
          <div className="field">
            <label>Ticket ID</label>
            <input
              value={assignTicketId}
              onChange={(e) => setAssignTicketId(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Agent user ID</label>
            <input
              value={assignAgentId}
              onChange={(e) => setAssignAgentId(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn secondary">
            Assign
          </button>
        </form>
      </div>
      {error ? <p className="error">{error}</p> : null}
      {tickets && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <h2>Recent tickets</h2>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {tickets.data.map((t) => (
                <tr key={ticketId(t)}>
                  <td style={{ fontSize: '0.75rem' }}>{ticketId(t)}</td>
                  <td>{t.title}</td>
                  <td>{t.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
