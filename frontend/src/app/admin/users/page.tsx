'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/components/AuthProvider';

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
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!user || user.role !== 'ADMIN') {
      router.replace('/login');
      return;
    }
    apiFetch<SafeUser[]>('/users')
      .then(setUsers)
      .catch((e: Error) => setError(e.message));
  }, [user, ready, router]);

  return (
    <div className="layout">
      <h1>Users</h1>
      <p>
        <Link href="/admin">Back</Link>
        {' · '}
        <Link href="/admin/agents/new">New agent</Link>
      </p>
      {error ? <p className="error">{error}</p> : null}
      <div className="card" style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const id =
                typeof u._id === 'string' ? u._id : u._id.toString();
              return (
                <tr key={id}>
                  <td style={{ fontSize: '0.75rem' }}>{id}</td>
                  <td>{u.email}</td>
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
    </div>
  );
}
