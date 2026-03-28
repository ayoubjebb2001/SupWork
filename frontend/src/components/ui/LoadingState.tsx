export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <p className="text-muted" aria-busy="true" aria-live="polite">
      {label}
    </p>
  );
}

export function LoadingSkeleton() {
  return (
    <div className="stack stack--tight" style={{ maxWidth: 240 }} aria-hidden>
      <div className="skeleton-line" style={{ width: '100%' }} />
      <div className="skeleton-line" style={{ width: '72%' }} />
    </div>
  );
}
