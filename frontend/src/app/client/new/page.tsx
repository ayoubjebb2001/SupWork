'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useEffect } from 'react';
import { apiBase, getAccessToken } from '@/lib/api';
import { parseErrorFromResponseBody } from '@/lib/parse-error';
import { useAuth } from '@/components/AuthProvider';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { InlineError } from '@/components/ui/ErrorBanner';
import { LoadingState } from '@/components/ui/LoadingState';

export default function NewTicketPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && (!user || user.role !== 'CLIENT')) {
      router.replace('/login');
    }
  }, [user, ready, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', title);
      fd.append('description', description);
      if (files) {
        for (let i = 0; i < files.length; i += 1) {
          fd.append('files', files[i]);
        }
      }
      const token = getAccessToken();
      const res = await fetch(`${apiBase}/tickets`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      });
      const text = await res.text();
      if (!res.ok) {
        setError(parseErrorFromResponseBody(text));
        return;
      }
      const t = JSON.parse(text) as { _id: { toString(): string } | string };
      const id = typeof t._id === 'string' ? t._id : t._id.toString();
      router.replace(`/client/ticket/${id}`);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready || !user || user.role !== 'CLIENT') {
    return (
      <PageShell variant="form">
        <LoadingState />
      </PageShell>
    );
  }

  return (
    <PageShell variant="form">
      <PageHeader title="New ticket" />
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label htmlFor="t">Title</label>
          <input
            id="t"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={5}
            maxLength={500}
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="d">Description</label>
          <textarea
            id="d"
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="f">Attachments (images / PDF)</label>
          <input
            id="f"
            type="file"
            multiple
            accept="image/*,.pdf,application/pdf"
            onChange={(e) => setFiles(e.target.files)}
            disabled={submitting}
          />
        </div>
        {error ? <InlineError>{error}</InlineError> : null}
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit'}
        </button>
      </form>
    </PageShell>
  );
}
