import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity()
export class TicketComment {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  ticketId: string;

  @Column()
  authorUserId: string;

  @Column()
  body: string;

  @Column()
  createdAt: Date;
}
