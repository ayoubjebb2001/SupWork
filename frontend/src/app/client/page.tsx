'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import type { Paginated, Ticket } from '@/types/ticket';
import { ticketId } from '@/types/ticket';

export default function ClientTicketsPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<Paginated<Ticket> | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'CLIENT') {
      router.replace('/login');
      return;
    }
    apiFetch<Paginated<Ticket>>(
      `/tickets/client/${user.sub}?page=1&limit=50`,
    )
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [user, ready, router]);

  if (!ready || !user) {
    return (
      <div className="layout">
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="layout">
      <h1>My tickets</h1>
      <p style={{ color: 'var(--muted)' }}>
        <Link href="/client/new">Create a ticket</Link>
      </p>
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
                    <Link href={`/client/ticket/${ticketId(t)}`}>
                      {t.title}
                    </Link>
                  </td>
                  <td>{t.status}</td>
                  <td>{t.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>
            {data.total} total
          </p>
        </div>
      )}
    </div>
  );
}
