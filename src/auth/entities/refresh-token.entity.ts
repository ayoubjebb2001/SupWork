import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity()
export class RefreshToken {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  userId: string;

  @Column()
  tokenHash: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  revoked: boolean;

  @Column()
  createdAt: Date;
}
