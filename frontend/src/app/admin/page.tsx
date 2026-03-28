'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import type { Paginated, Ticket } from '@/types/ticket';
import { ticketId } from '@/types/ticket';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { LoadingState } from '@/components/ui/LoadingState';
import { StatCard } from '@/components/ui/StatCard';

type AgentUser = {
  _id: string;
  firstName: string;
  lastname: string;
  email: string;
  role: string;
  department?: string;
  jobTitle?: string;
};

type LeaderRow = {
  agentId: string;
  resolvedCount: number;
  averageResolutionMs: number | null;
};

function formatAgentOption(a: AgentUser): string {
  const name = `${a.firstName} ${a.lastname}`.trim();
  const extra = [a.jobTitle, a.department].filter(Boolean).join(' · ');
  const tail = extra ? ` — ${extra}` : '';
  return `${name} (${a.email})${tail}`;
}

function idOf(u: AgentUser): string {
  return u._id;
}

export default function AdminDashboardPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Paginated<Ticket> | null>(null);
  const [globalStats, setGlobalStats] = useState<{
    countByStatus: Record<string, number>;
    totalTickets: number;
    averageResolutionMs: number | null;
  } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [agentUsers, setAgentUsers] = useState<AgentUser[]>([]);
  const [assignPick, setAssignPick] = useState<Record<string, string>>({});
  const [assigningTicketId, setAssigningTicketId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  const agentById = useMemo(() => {
    const m = new Map<string, AgentUser>();
    for (const a of agentUsers) {
      m.set(idOf(a), a);
    }
    return m;
  }, [agentUsers]);

  const refreshTickets = useCallback(async () => {
    const t = await apiFetch<Paginated<Ticket>>(`/tickets/admin?page=1&limit=50`);
    setTickets(t);
    setAssignPick((prev) => {
      const next = { ...prev };
      for (const row of t.data) {
        const tid = ticketId(row);
        if (next[tid] === undefined) {
          next[tid] = row.assignedAgentId ?? '';
        }
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'ADMIN') {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    setLoadError('');
    Promise.all([
      apiFetch<Paginated<Ticket>>(`/tickets/admin?page=1&limit=50`),
      apiFetch(`/stats/admin`),
      apiFetch(`/stats/admin/agents`),
      apiFetch<AgentUser[]>(`/users`),
    ])
      .then(([t, g, lb, allUsers]) => {
        if (cancelled) {
          return;
        }
        setTickets(t);
        setGlobalStats(g as typeof globalStats);
        setLeaderboard(lb as LeaderRow[]);
        const agents = allUsers.filter((u) => u.role === 'AGENT');
        setAgentUsers(agents);
        const initial: Record<string, string> = {};
        for (const row of t.data) {
          initial[ticketId(row)] = row.assignedAgentId ?? '';
        }
        setAssignPick(initial);
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setLoadError(e.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, ready, router, retryKey]);

  async function assignRow(ticket: Ticket) {
    const tid = ticketId(ticket);
    const agentId = assignPick[tid]?.trim();
    if (!agentId) {
      setError('Choose an agent first.');
      return;
    }
    setError('');
    setAssigningTicketId(tid);
    try {
      await apiFetch(`/tickets/admin/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId: tid, agentId }),
      });
      await refreshTickets();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Assign failed');
    } finally {
      setAssigningTicketId(null);
    }
  }

  function assigneeLabel(ticket: Ticket): string {
    const aid = ticket.assignedAgentId;
    if (!aid) {
      return '—';
    }
    const u = agentById.get(aid);
    if (!u) {
      return `${aid.slice(0, 8)}…`;
    }
    return `${u.firstName} ${u.lastname} (${u.email})`;
  }

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
        title="Admin"
        meta={
          <>
            <Link href="/admin/users">Users</Link>
            <span className="text-muted" aria-hidden>
              ·
            </span>
            <Link href="/audit/logs">Audit log</Link>
          </>
        }
      />
      {loadError ? (
        <ErrorBanner
          message={loadError}
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      ) : null}
      {globalStats ? (
        <StatCard title="Global overview">
          <div className="metric-row">
            <div className="metric">
              <div className="metric__value">{globalStats.totalTickets}</div>
              <div className="metric__label">Total</div>
            </div>
            <div className="metric">
              <div className="metric__value">
                {globalStats.countByStatus['OPEN'] ?? 0}
              </div>
              <div className="metric__label">Open</div>
            </div>
            <div className="metric">
              <div className="metric__value">
                {globalStats.countByStatus['IN_PROGRESS'] ?? 0}
              </div>
              <div className="metric__label">In progress</div>
            </div>
            <div className="metric">
              <div className="metric__value">
                {globalStats.countByStatus['RESOLVED'] ?? 0}
              </div>
              <div className="metric__label">Resolved</div>
            </div>
            {globalStats.averageResolutionMs != null ? (
              <div className="metric">
                <div className="metric__value">
                  {Math.round(globalStats.averageResolutionMs / 3600000)}h
                </div>
                <div className="metric__label">Avg resolution</div>
              </div>
            ) : null}
          </div>
        </StatCard>
      ) : null}
      {leaderboard.length > 0 ? (
        <StatCard title="Agents — resolved volume">
          <ul
            style={{
              margin: 0,
              paddingLeft: '1.25rem',
              color: 'var(--color-text-subtle)',
              fontSize: '0.9375rem',
            }}
          >
            {leaderboard.slice(0, 8).map((a) => {
              const info = agentById.get(a.agentId);
              const label = info
                ? `${info.firstName} ${info.lastname}`
                : a.agentId.slice(0, 8);
              return (
                <li key={a.agentId}>
                  <strong style={{ color: 'var(--color-text)' }}>{label}</strong>
                  : {a.resolvedCount} resolved
                </li>
              );
            })}
          </ul>
        </StatCard>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      {tickets ? (
        <div className="card table-wrap">
          <h2 style={{ marginTop: 0 }}>Tickets</h2>
          <p className="text-muted">
            Only tickets in <strong>OPEN</strong> status can be assigned. Pick an
            agent and click Assign.
          </p>
          <table>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Priority</th>
                <th scope="col">Assignee</th>
                <th scope="col">Assign to agent</th>
                <th scope="col">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {tickets.data.map((t) => {
                const tid = ticketId(t);
                const canAssign = t.status === 'OPEN';
                const busy = assigningTicketId === tid;
                return (
                  <tr key={tid}>
                    <td className="min-w-0">
                      <span
                        className="break-words"
                        style={{ display: 'block', maxWidth: '18rem' }}
                        title={t.title}
                      >
                        {t.title}
                      </span>
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>
                      <PriorityBadge priority={t.priority} />
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.875rem', maxWidth: '14rem' }}>
                      <span className="break-words">{assigneeLabel(t)}</span>
                    </td>
                    <td style={{ minWidth: '16rem' }}>
                      <select
                        className="admin-agent-select"
                        value={assignPick[tid] ?? ''}
                        disabled={!canAssign || busy || agentUsers.length === 0}
                        onChange={(e) =>
                          setAssignPick((prev) => ({
                            ...prev,
                            [tid]: e.target.value,
                          }))
                        }
                        aria-label={`Assign agent for ${t.title}`}
                      >
                        <option value="">
                          {agentUsers.length === 0
                            ? 'No agents — add in Users'
                            : 'Select agent…'}
                        </option>
                        {agentUsers.map((a) => (
                          <option key={idOf(a)} value={idOf(a)}>
                            {formatAgentOption(a)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={
                          !canAssign || busy || !assignPick[tid]?.trim()
                        }
                        onClick={() => assignRow(t)}
                      >
                        {busy ? '…' : 'Assign'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="text-muted">
            Showing {tickets.data.length} of {tickets.total} (page {tickets.page}
            ).
          </p>
        </div>
      ) : !loadError ? (
        <LoadingState label="Loading dashboard…" />
      ) : null}
    </PageShell>
  );
}
