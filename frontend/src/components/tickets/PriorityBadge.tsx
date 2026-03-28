const PRIORITY_CLASS: Record<string, string> = {
  LOW: 'badge--neutral',
  MEDIUM: 'badge--info',
  HIGH: 'badge--danger',
};

export function PriorityBadge({ priority }: { priority: string }) {
  const cls = PRIORITY_CLASS[priority] ?? 'badge--neutral';
  return (
    <span className={`badge ${cls}`} title={priority}>
      {priority}
    </span>
  );
}
