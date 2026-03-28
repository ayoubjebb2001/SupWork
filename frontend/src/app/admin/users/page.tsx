'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';
import { PageShell } from '@/components/ui/PageShell';
import { PageHeader } from '@/components/ui/PageHeader';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingState } from '@/components/ui/LoadingState';

type SafeUser = {
  _id: { toString(): string } | string;
  email: string;
  firstName: string;
  lastname: string;
  role: string;
};

export default function AdminUsersPage() {
  const { user, ready } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<SafeUser[] | null>(null);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'ADMIN') {
      router.replace('/login');
      return;
    }
    let cancelled = false;
    setError('');
    apiFetch<SafeUser[]>('/users')
      .then((u) => {
        if (!cancelled) {
          setUsers(u);
        }
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setError(e.message);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user, ready, router, retryKey]);

  if (!ready || !user) {
    return (
      <PageShell>
        <LoadingState />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        title="Users"
        meta={
          <>
            <Link href="/admin">Admin home</Link>
            <span className="text-muted" aria-hidden>
              ·
            </span>
            <Link href="/admin/agents/new">New agent</Link>
          </>
        }
      />
      {error ? (
        <ErrorBanner message={error} onRetry={() => setRetryKey((k) => k + 1)} />
      ) : null}
      {users && users.length === 0 ? (
        <EmptyState title="No users loaded" hint="Try refreshing or check the API." />
      ) : null}
      {users && users.length > 0 ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">ID</th>
                <th scope="col">Email</th>
                <th scope="col">Name</th>
                <th scope="col">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const id = typeof u._id === 'string' ? u._id : u._id.toString();
                return (
                  <tr key={id}>
                    <td className="text-muted" style={{ fontSize: '0.75rem', maxWidth: '8rem' }}>
                      <span className="break-words" title={id}>
                        {id}
                      </span>
                    </td>
                    <td className="min-w-0">
                      <span className="break-words">{u.email}</span>
                    </td>
                    <td>
                      {u.firstName} {u.lastname}
                    </td>
                    <td>{u.role}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
      {!users && !error ? <LoadingState label="Loading users…" /> : null}
    </PageShell>
  );
}
