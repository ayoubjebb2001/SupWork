import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity()
export class AuditLog {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  actorUserId: string;

  @Column()
  action: string;

  @Column()
  entityType: string;

  @Column()
  entityId: string;

  @Column({ nullable: true })
  metadata?: Record<string, unknown>;

  @Column()
  createdAt: Date;
}
