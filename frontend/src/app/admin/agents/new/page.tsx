'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

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

  useEffect(() => {
    if (ready && (!user || user.role !== 'ADMIN')) {
      router.replace('/login');
    }
  }, [user, ready, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/users/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      router.replace('/admin/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }

  function upd<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  if (!ready || !user || user.role !== 'ADMIN') {
    return <p className="layout">Loading…</p>;
  }

  return (
    <div className="layout" style={{ maxWidth: 480 }}>
      <h1>New agent</h1>
      <p>
        <Link href="/admin/users">Back</Link>
      </p>
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label>First name</label>
          <input
            value={form.firstName}
            onChange={(e) => upd('firstName', e.target.value)}
            required
            minLength={2}
          />
        </div>
        <div className="field">
          <label>Last name</label>
          <input
            value={form.lastName}
            onChange={(e) => upd('lastName', e.target.value)}
            required
            minLength={2}
          />
        </div>
        <div className="field">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => upd('email', e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>Phone</label>
          <input
            value={form.phoneNumber}
            onChange={(e) => upd('phoneNumber', e.target.value)}
            required
            minLength={10}
          />
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(e) => upd('password', e.target.value)}
            required
            minLength={8}
          />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="btn">
          Create agent
        </button>
      </form>
    </div>
  );
}
