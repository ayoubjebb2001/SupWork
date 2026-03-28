const STATUS_CLASS: Record<string, string> = {
  OPEN: 'badge--info',
  IN_PROGRESS: 'badge--warning',
  RESOLVED: 'badge--success',
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLASS[status] ?? 'badge--neutral';
  return (
    <span className={`badge ${cls}`} title={status}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}
