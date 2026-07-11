import { User } from '../../database/entities';

export function sanitizeUser(user: User): Omit<User, 'password' | 'refreshToken'> {
  const { password: _, refreshToken: __, ...rest } = user as any;
  return rest;
}
