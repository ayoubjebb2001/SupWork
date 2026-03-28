'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiBase } from '@/lib/api';
import { parseErrorFromResponseBody } from '@/lib/parse-error';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { InlineError } from '@/components/ui/ErrorBanner';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    companyName: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/users/signup/client`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          companyName: form.companyName || undefined,
        }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(parseErrorFromResponseBody(text));
        return;
      }
      router.replace('/login');
    } finally {
      setSubmitting(false);
    }
  }

  function upd<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <PageShell variant="narrow">
      <PageHeader title="Client sign up" />
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label htmlFor="fn">First name</label>
          <input
            id="fn"
            value={form.firstName}
            onChange={(e) => upd('firstName', e.target.value)}
            required
            minLength={2}
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="ln">Last name</label>
          <input
            id="ln"
            value={form.lastName}
            onChange={(e) => upd('lastName', e.target.value)}
            required
            minLength={2}
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="em">Email</label>
          <input
            id="em"
            type="email"
            value={form.email}
            onChange={(e) => upd('email', e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="ph">Phone</label>
          <input
            id="ph"
            value={form.phoneNumber}
            onChange={(e) => upd('phoneNumber', e.target.value)}
            required
            minLength={10}
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="pw">Password</label>
          <input
            id="pw"
            type="password"
            value={form.password}
            onChange={(e) => upd('password', e.target.value)}
            required
            minLength={8}
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="co">Company (optional)</label>
          <input
            id="co"
            value={form.companyName}
            onChange={(e) => upd('companyName', e.target.value)}
            disabled={submitting}
          />
        </div>
        {error ? <InlineError>{error}</InlineError> : null}
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create account'}
        </button>
      </form>
    </PageShell>
  );
}
