'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import type { Ticket } from '@/types/ticket';

type Comment = {
  _id: { toString(): string } | string;
  body: string;
  authorUserId: string;
  createdAt: string;
};

export default function ClientTicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, ready } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'CLIENT') {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const t = await apiFetch<Ticket>(`/tickets/${id}`);
        const c = await apiFetch<Comment[]>(`/tickets/${id}/comments`);
        if (!cancelled) {
          setTicket(t);
          setComments(c);
        }
      } catch (err) {
        if (!cancelled && err instanceof Error) {
          setError(err.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, ready, id, router]);

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    await apiFetch(`/tickets/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    setBody('');
    const t = await apiFetch<Ticket>(`/tickets/${id}`);
    const c = await apiFetch<Comment[]>(`/tickets/${id}/comments`);
    setTicket(t);
    setComments(c);
  }

  if (!ticket) {
    return (
      <div className="layout">
        {error ? <p className="error">{error}</p> : <p>Loading…</p>}
      </div>
    );
  }

  return (
    <div className="layout">
      <div className="card">
        <h1>{ticket.title}</h1>
        <p style={{ color: 'var(--muted)' }}>
          {ticket.status} · {ticket.priority}
        </p>
        <p>{ticket.description}</p>
      </div>
      <h2>Comments</h2>
      <div className="card">
        {comments.map((c) => (
          <div
            key={typeof c._id === 'string' ? c._id : c._id.toString()}
            style={{ marginBottom: '0.75rem' }}
          >
            <small style={{ color: 'var(--muted)' }}>
              {c.authorUserId} · {new Date(c.createdAt).toLocaleString()}
            </small>
            <p style={{ margin: '0.25rem 0 0' }}>{c.body}</p>
          </div>
        ))}
        <form onSubmit={addComment}>
          <div className="field">
            <label htmlFor="b">Add comment</label>
            <textarea
              id="b"
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn secondary">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
