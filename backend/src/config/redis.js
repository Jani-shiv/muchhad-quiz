import Redis from 'ioredis';
import { env } from './env.js';

function createRedisClient(name) {
  const client = new Redis(env.redisUrl, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
  });
  client.on('connect', () => console.log(`[Redis:${name}] Connected`));
  client.on('error', (err) => console.error(`[Redis:${name}] Error:`, err.message));
  return client;
}

export const redis = createRedisClient('state');
export const pubClient = createRedisClient('pub');
export const subClient = pubClient.duplicate();
subClient.on('error', (err) => console.error('[Redis:sub] Error:', err.message));
