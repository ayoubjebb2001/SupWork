'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import type { Ticket } from '@/types/ticket';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import {
  CommentThread,
  type ThreadComment,
} from '@/components/tickets/CommentThread';
import { PageShell } from '@/components/ui/PageShell';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { LoadingState } from '@/components/ui/LoadingState';

export default function ClientTicketDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { user, ready } = useAuth();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<ThreadComment[]>([]);
  const [body, setBody] = useState('');
  const [loadError, setLoadError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const [commentErr, setCommentErr] = useState('');
  const [commentBusy, setCommentBusy] = useState(false);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'CLIENT') {
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
    } catch (err) {
      setCommentErr(err instanceof Error ? err.message : 'Could not send comment');
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
        <p style={{ marginBottom: 'var(--space-3)' }}>
          <StatusBadge status={ticket.status} />{' '}
          <PriorityBadge priority={ticket.priority} />
        </p>
        <p className="break-words">{ticket.description}</p>
      </div>
      <CommentThread
        comments={comments}
        body={body}
        onBodyChange={setBody}
        onSubmit={addComment}
        submitLabel="Send"
        composerLabel="Add comment"
        submitting={commentBusy}
        error={commentErr}
        showTimestamp
      />
    </PageShell>
  );
}
