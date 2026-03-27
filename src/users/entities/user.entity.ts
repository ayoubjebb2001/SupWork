import { UserRole, UserStatus } from 'src/enums/user.enums';
import { Column, Entity, ObjectId, ObjectIdColumn } from 'typeorm';

@Entity()
export class User {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  firstName: string;

  @Column()
  lastname: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  role: UserRole;

  @Column({ default: false })
  isTwoFactorEnabled: boolean;

  @Column({ default: UserStatus.Active })
  status: UserStatus;

  @Column()
  isAvailable?: boolean;

  @Column()
  lastLoginAt?: Date;

  @Column()
  phoneNumber: string;

  @Column()
  department?: string;

  @Column()
  jobTitle?: string;

  @Column()
  companyName?: string;
}
