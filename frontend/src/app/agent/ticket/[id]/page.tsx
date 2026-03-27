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

export default function AgentTicketPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, ready } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'AGENT') {
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
          setStatus(t.status);
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

  async function saveStatus(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    await apiFetch(`/tickets/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const t = await apiFetch<Ticket>(`/tickets/${id}`);
    const c = await apiFetch<Comment[]>(`/tickets/${id}/comments`);
    setTicket(t);
    setComments(c);
    setStatus(t.status);
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
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
    setStatus(t.status);
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
        <p>{ticket.description}</p>
        <form onSubmit={saveStatus}>
          <div className="field">
            <label htmlFor="st">Status</label>
            <select
              id="st"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
          <button type="submit" className="btn">
            Save status
          </button>
        </form>
      </div>
      <h2>Comments</h2>
      <div className="card">
        {comments.map((c) => (
          <div
            key={typeof c._id === 'string' ? c._id : c._id.toString()}
            style={{ marginBottom: '0.75rem' }}
          >
            <small style={{ color: 'var(--muted)' }}>{c.authorUserId}</small>
            <p style={{ margin: '0.25rem 0 0' }}>{c.body}</p>
          </div>
        ))}
        <form onSubmit={addComment}>
          <div className="field">
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn secondary">
            Reply
          </button>
        </form>
      </div>
    </div>
  );
}
