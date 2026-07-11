import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET || process.env.JWT_ACCESS_SECRET;
  const refreshSecret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET or JWT_ACCESS_SECRET environment variable is required but not set');
  }
  if (!refreshSecret) {
    throw new Error('JWT_REFRESH_SECRET environment variable is required but not set');
  }
  return {
    secret,
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshSecret,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
    issuer: process.env.JWT_ISSUER || 'fee-menouf-platform',
    audience: process.env.JWT_AUDIENCE || 'fee-menouf-platform',
  };
});
