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

  @Column()
  passwordHash: string;

  @Column()
  role: UserRole;

  @Column()
  isEmailVerified: boolean;

  @Column()
  isTwoFactorEnabled: boolean;

  @Column()
  status: UserStatus;

  @Column()
  isAvailable: boolean;

  @Column()
  lastLoginAt?: Date;
}
