import { UserRole } from 'src/enums/user.enums';

export type AuthenticatedUser = {
  sub: string;
  role: UserRole;
  email: string;
};

export type AuthenticatedRequest = {
  user?: AuthenticatedUser;
};

