import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  meta,
}: {
  title: string;
  description?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="page-header">
      <h1 className="page-header__title">{title}</h1>
      {description ? (
        <p className="text-muted" style={{ marginBottom: meta ? 'var(--space-2)' : 0 }}>
          {description}
        </p>
      ) : null}
      {meta ? <div className="page-header__meta">{meta}</div> : null}
    </header>
  );
}
