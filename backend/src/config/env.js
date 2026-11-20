import dotenv from 'dotenv';
dotenv.config();

const rawOrigins = process.env.CORS_ORIGIN || '*';

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  corsOrigins: rawOrigins === '*' ? ['*'] : rawOrigins.split(',').map((o) => o.trim()).filter(Boolean),
  databaseUrl: process.env.DATABASE_URL || 'postgres://quizblitz:quizblitz_secret@localhost:5432/quizblitz',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev_secret_change_me_in_production_64chars',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  // For generating join URLs accessible from other devices
  publicHost: process.env.PUBLIC_HOST || 'localhost:8070',
};
