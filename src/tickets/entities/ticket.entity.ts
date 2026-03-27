import { TicketPriority, TicketStatus } from 'src/enums/ticket.enums';
import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity()
export class Ticket {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column()
  clientId: string;

  @Column({ nullable: true })
  assignedAgentId?: string;

  @Column({ default: [] })
  attachmentIds: string[];

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}

