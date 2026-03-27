import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity()
export class Attachment {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  ticketId: string;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column()
  mimeType: string;

  @Column()
  fileSize: number;

  @Column()
  uploadedByUserId: string;

  @Column()
  createdAt: Date;
}

