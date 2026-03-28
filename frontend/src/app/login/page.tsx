'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiBase, setTokens } from '@/lib/api';
import { parseErrorFromResponseBody } from '@/lib/parse-error';
import { useAuth } from '@/components/AuthProvider';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { InlineError } from '@/components/ui/ErrorBanner';

export default function LoginPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBase}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const text = await res.text();
      if (!res.ok) {
        setError(parseErrorFromResponseBody(text));
        return;
      }
      const data = JSON.parse(text) as {
        accessToken: string;
        refreshToken: string;
      };
      setTokens(data.accessToken, data.refreshToken);
      refreshUser();
      router.replace('/');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PageShell variant="narrow">
      <PageHeader title="Log in" />
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={submitting}
          />
        </div>
        {error ? <InlineError>{error}</InlineError> : null}
        <button type="submit" className="btn" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Continue'}
        </button>
      </form>
    </PageShell>
  );
}
