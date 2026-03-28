'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { InlineError } from '@/components/ui/ErrorBanner';
import { LoadingState } from '@/components/ui/LoadingState';

export default function NewAgentPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (ready && (!user || user.role !== 'ADMIN')) {
      router.replace('/login');
    }
  }, [user, ready, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await apiFetch('/users/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      router.replace('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setSubmitting(false);
    }
  }

  function upd<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  if (!ready || !user || user.role !== 'ADMIN') {
    return (
      <PageShell variant="form">
        <LoadingState />
      </PageShell>
    );
  }

  return (
    <PageShell variant="form">
      <PageHeader
        title="New agent"
        meta={<Link href="/admin/users">Back to users</Link>}
      />
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label htmlFor="agent-fn">First name</label>
          <input
            id="agent-fn"
            value={form.firstName}
            onChange={(e) => upd('firstName', e.target.value)}
            required
            minLength={2}
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="agent-ln">Last name</label>
          <input
            id="agent-ln"
            value={form.lastName}
            onChange={(e) => upd('lastName', e.target.value)}
            required
            minLength={2}
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="agent-em">Email</label>
          <input
            id="agent-em"
            type="email"
            value={form.email}
            onChange={(e) => upd('email', e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="agent-ph">Phone</label>
          <input
            id="agent-ph"
            value={form.phoneNumber}
            onChange={(e) => upd('phoneNumber', e.target.value)}
            required
            minLength={10}
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="agent-pw">Password</label>
          <input
            id="agent-pw"
            type="password"
            value={form.password}
            onChange={(e) => upd('password', e.target.value)}
            required
            minLength={8}
            disabled={submitting}
          />
        </div>
        {error ? <InlineError>{error}</InlineError> : null}
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create agent'}
        </button>
      </form>
    </PageShell>
  );
}
