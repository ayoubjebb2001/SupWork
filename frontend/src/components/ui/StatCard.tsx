'use client';

import { useId, type ReactNode } from 'react';

export function StatCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const hid = useId();
  return (
    <section className="card" aria-labelledby={hid}>
      <h3
        id={hid}
        className="text-muted"
        style={{
          margin: 0,
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {title}
      </h3>
      <div style={{ marginTop: 'var(--space-3)' }}>{children}</div>
    </section>
  );
}
