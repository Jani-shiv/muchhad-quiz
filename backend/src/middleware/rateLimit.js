import rateLimit from 'express-rate-limit';

export const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, try again later.' },
});

/**
 * Lightweight per-socket token-bucket / sliding-window rate limiter.
 */
export class SocketRateLimiter {
  constructor() {
    this.buckets = new Map();
  }

  allow(socketId, event, maxCount = 5, windowMs = 2000) {
    const key = `${socketId}:${event}`;
    const now = Date.now();
    let entry = this.buckets.get(key);
    if (!entry || now - entry.windowStart > windowMs) {
      entry = { windowStart: now, count: 1 };
      this.buckets.set(key, entry);
      return true;
    }
    if (entry.count >= maxCount) {
      return false;
    }
    entry.count += 1;
    return true;
  }

  cleanup(socketId) {
    for (const key of this.buckets.keys()) {
      if (key.startsWith(`${socketId}:`)) {
        this.buckets.delete(key);
      }
    }
  }
}

export const socketRateLimiter = new SocketRateLimiter();
