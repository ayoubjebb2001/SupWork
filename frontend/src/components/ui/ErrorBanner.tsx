'use client';

import type { ReactNode } from 'react';

export function ErrorBanner({
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  if (!message) {
    return null;
  }

  return (
    <div
      className="card"
      style={{
        borderColor: 'var(--color-danger)',
        background: 'var(--color-danger-bg)',
        marginBottom: 'var(--space-4)',
      }}
      role="alert"
      aria-live="polite"
    >
      <p className="error" style={{ margin: 0 }}>
        {message}
      </p>
      {onRetry ? (
        <div style={{ marginTop: 'var(--space-3)' }}>
          <button type="button" className="btn secondary" onClick={onRetry}>
            {retryLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Inline error without card styling (forms). */
export function InlineError({ children }: { children: ReactNode }) {
  if (!children) {
    return null;
  }
  return (
    <p className="error" role="alert">
      {children}
    </p>
  );
}
