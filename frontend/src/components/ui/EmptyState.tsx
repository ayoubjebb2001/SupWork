import type { ReactNode } from 'react';

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-panel card">
      <p style={{ margin: 0, fontWeight: 600, color: 'var(--color-text)' }}>{title}</p>
      {hint ? (
        <p className="text-muted" style={{ marginTop: 'var(--space-2)', marginBottom: 0 }}>
          {hint}
        </p>
      ) : null}
      {action ? <div style={{ marginTop: 'var(--space-4)' }}>{action}</div> : null}
    </div>
  );
}
