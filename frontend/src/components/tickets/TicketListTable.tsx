import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Ticket } from '@/types/ticket';
import { ticketId } from '@/types/ticket';
import { PriorityBadge } from '@/components/tickets/PriorityBadge';
import { StatusBadge } from '@/components/tickets/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

type Props = {
  tickets: Ticket[];
  basePath: '/client/ticket' | '/agent/ticket';
  emptyTitle?: string;
  emptyHint?: ReactNode;
};

export function TicketListTable({
  tickets,
  basePath,
  emptyTitle = 'No tickets yet',
  emptyHint,
}: Props) {
  if (tickets.length === 0) {
    return <EmptyState title={emptyTitle} hint={emptyHint} />;
  }

  return (
    <div className="card table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Status</th>
            <th scope="col">Priority</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((t) => {
            const id = ticketId(t);
            return (
              <tr key={id}>
                <td className="min-w-0">
                  <Link
                    href={`${basePath}/${id}`}
                    className="break-words"
                    style={{ display: 'block', maxWidth: 'min(100%, 28rem)' }}
                    title={t.title}
                  >
                    {t.title}
                  </Link>
                </td>
                <td>
                  <StatusBadge status={t.status} />
                </td>
                <td>
                  <PriorityBadge priority={t.priority} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
