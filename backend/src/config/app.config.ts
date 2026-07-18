import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.APP_PORT || process.env.PORT || '4000', 10),
  name: process.env.APP_NAME || 'FEE-MENOUF-Smart-University',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  corsMethods: (process.env.CORS_METHODS || 'GET,POST,PUT,PATCH,DELETE,OPTIONS').split(','),
  corsCredentials: process.env.CORS_CREDENTIALS === 'true',
  redisHost: process.env.REDIS_HOST || 'redis',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  redisDbIndex: parseInt(process.env.REDIS_DB_INDEX || '0', 10),
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  loginRateLimitMax: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5', 10),
  loginRateLimitWindow: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW || '900000', 10),
  aiEngineUrl: process.env.AI_ENGINE_URL || 'http://ai-engine:8000',
  qrSigningKey: process.env.QR_SIGNING_KEY,
}));
