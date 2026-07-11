import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT || process.env.PORT || '4000', 10),
  name: process.env.APP_NAME || 'FEE-MENOUF-Smart-University',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  corsMethods: (process.env.CORS_METHODS || 'GET,POST,PUT,PATCH,DELETE,OPTIONS').split(','),
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',
}));
