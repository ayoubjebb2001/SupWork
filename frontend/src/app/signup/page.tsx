'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiBase } from '@/lib/api';

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

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
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
      setError(text);
      return;
    }
    router.replace('/login');
  }

  function upd<K extends keyof typeof form>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  return (
    <div className="layout" style={{ maxWidth: 420 }}>
      <h1>Client sign up</h1>
      <form onSubmit={onSubmit} className="card">
        <div className="field">
          <label htmlFor="fn">First name</label>
          <input
            id="fn"
            value={form.firstName}
            onChange={(e) => upd('firstName', e.target.value)}
            required
            minLength={2}
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
          />
        </div>
        <div className="field">
          <label htmlFor="co">Company (optional)</label>
          <input
            id="co"
            value={form.companyName}
            onChange={(e) => upd('companyName', e.target.value)}
          />
        </div>
        {error ? <p className="error">{error}</p> : null}
        <button type="submit" className="btn">
          Create account
        </button>
      </form>
    </div>
  );
}
