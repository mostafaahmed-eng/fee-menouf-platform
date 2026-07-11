import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD ?? (() => { throw new Error('DB_PASSWORD environment variable is required but not set'); })(),
  database: process.env.DB_DATABASE || 'fee_menouf_platform',
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
  logging: process.env.DB_LOGGING === 'false'
    ? ['error']
    : (process.env.DB_LOGGING || 'error,schema,warn,info').split(',').map((s) => s.trim()),
  poolMin: parseInt(process.env.DB_POOL_MIN || '2', 10),
  poolMax: parseInt(process.env.DB_POOL_MAX || '20', 10),
  sslEnabled: process.env.DB_SSL_ENABLED === 'true',
  sslCaPath: process.env.DB_SSL_CA_PATH || '',
  // Production SSL config - uncomment for production:
  // ssl: { rejectUnauthorized: true, ca: process.env.DB_SSL_CA },
}));
