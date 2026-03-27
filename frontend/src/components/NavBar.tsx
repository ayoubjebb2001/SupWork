'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export function NavBar() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <nav className="nav layout">
        <strong>SupWork</strong>
        <Link href="/login">Log in</Link>
        <Link href="/signup">Sign up</Link>
      </nav>
    );
  }

  return (
    <nav className="nav layout">
      <strong>SupWork</strong>
      <span className="role">
        {user.email} · <span className="badge">{user.role}</span>
      </span>
      {user.role === 'CLIENT' && (
        <>
          <Link href="/client">My tickets</Link>
          <Link href="/client/new">New ticket</Link>
        </>
      )}
      {user.role === 'AGENT' && <Link href="/agent">Assigned</Link>}
      {user.role === 'ADMIN' && (
        <>
          <Link href="/admin">Admin</Link>
          <Link href="/admin/users">Users</Link>
        </>
      )}
      <Link href="/">Home</Link>
      <button type="button" className="btn secondary" onClick={() => logout()}>
        Log out
      </button>
    </nav>
  );
}
