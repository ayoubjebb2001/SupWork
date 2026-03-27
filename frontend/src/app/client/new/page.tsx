'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { apiBase, getAccessToken } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { useEffect } from 'react';

export default function NewTicketPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (ready && (!user || user.role !== 'CLIENT')) {
      router.replace('/login');
    }
  }, [user, ready, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
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
      setError(text);
      return;
    }
    const t = JSON.parse(text) as { _id: { toString(): string } | string };
    const id = typeof t._id === 'string' ? t._id : t._id.toString();
    router.replace(`/client/ticket/${id}`);
  }

  if (!ready || !user || user.role !== 'CLIENT') {
    return (
      <div className="layout">
        <p style={{ color: 'var(--muted)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div className="layout" style={{ maxWidth: 560 }}>
      <h1>New ticket</h1>
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label htmlFor="t">Title</label>
          <input
            id="t"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={5}
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
          />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="btn">
          Submit
        </button>
      </form>
    </div>
  );
}
