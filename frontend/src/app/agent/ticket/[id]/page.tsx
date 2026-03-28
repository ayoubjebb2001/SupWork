'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import type { Ticket } from '@/types/ticket';
import {
  CommentThread,
  type ThreadComment,
} from '@/components/tickets/CommentThread';
import { PageShell } from '@/components/ui/PageShell';
import { ErrorBanner, InlineError } from '@/components/ui/ErrorBanner';
import { LoadingState } from '@/components/ui/LoadingState';

export default function AgentTicketPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, ready } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [status, setStatus] = useState('');
  const [body, setBody] = useState('');
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [statusErr, setStatusErr] = useState('');
  const [commentErr, setCommentErr] = useState('');
  const [statusBusy, setStatusBusy] = useState(false);
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'AGENT') {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    setLoadError('');
    void (async () => {
      try {
        const t = await apiFetch<Ticket>(`/tickets/${id}`);
        const c = await apiFetch<ThreadComment[]>(`/tickets/${id}/comments`);
        if (!cancelled) {
          setTicket(t);
          setComments(c);
          setStatus(t.status);
        }
      } catch (err) {
        if (!cancelled && err instanceof Error) {
          setLoadError(err.message);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, ready, id, router, retryKey]);

  async function saveStatus(e: React.FormEvent) {
    e.preventDefault();
    setStatusErr('');
    setStatusBusy(true);
    try {
      await apiFetch(`/tickets/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const t = await apiFetch<Ticket>(`/tickets/${id}`);
      const c = await apiFetch<ThreadComment[]>(`/tickets/${id}/comments`);
      setTicket(t);
      setComments(c);
      setStatus(t.status);
    } catch (err) {
      setStatusErr(err instanceof Error ? err.message : 'Could not update status');
    } finally {
      setStatusBusy(false);
    }
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    setCommentErr('');
    setCommentBusy(true);
    try {
      await apiFetch(`/tickets/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      });
      setBody('');
      const t = await apiFetch<Ticket>(`/tickets/${id}`);
      const c = await apiFetch<ThreadComment[]>(`/tickets/${id}/comments`);
      setTicket(t);
      setComments(c);
      setStatus(t.status);
    } catch (err) {
      setCommentErr(err instanceof Error ? err.message : 'Could not send reply');
    } finally {
      setCommentBusy(false);
    }
  }

  if (!ticket && !loadError) {
    return (
      <PageShell>
        <LoadingState label="Loading ticket…" />
      </PageShell>
    );
  }

  if (loadError && !ticket) {
    return (
      <PageShell>
        <ErrorBanner
          message={loadError}
          onRetry={() => setRetryKey((k) => k + 1)}
        />
      </PageShell>
    );
  }

  if (!ticket) {
    return null;
  }

  return (
    <PageShell>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>{ticket.title}</h1>
        <p className="break-words">{ticket.description}</p>
        <form onSubmit={saveStatus} className="stack stack--tight" style={{ marginTop: 'var(--space-4)' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="st">Status</label>
            <select
              id="st"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              disabled={statusBusy}
            >
              <option value="OPEN">OPEN</option>
              <option value="IN_PROGRESS">IN_PROGRESS</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>
          </div>
          {statusErr ? <InlineError>{statusErr}</InlineError> : null}
          <button type="submit" className="btn" disabled={statusBusy}>
            {statusBusy ? 'Saving…' : 'Save status'}
          </button>
        </form>
      </div>
      <CommentThread
        comments={comments}
        body={body}
        onBodyChange={setBody}
        onSubmit={addComment}
        submitLabel="Reply"
        submitting={commentBusy}
        error={commentErr}
        showTimestamp
      />
    </PageShell>
  );
}
