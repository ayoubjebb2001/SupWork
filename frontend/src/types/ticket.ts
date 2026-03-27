export type Ticket = {
  _id: { toString(): string } | string;
  title: string;
  description: string;
  status: string;
  priority: string;
  clientId: string;
  assignedAgentId?: string;
  createdAt: string;
  updatedAt: string;
};

export function ticketId(t: Ticket): string {
  const id = t._id;
  return typeof id === 'string' ? id : id.toString();
}

export type Paginated<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};
