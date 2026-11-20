import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';

import { env } from './config/env.js';
import { pubClient, subClient } from './config/redis.js';
import { runMigrations } from './db/migrate.js';
import { apiRateLimiter } from './middleware/rateLimit.js';
import authRoutes from './routes/auth.js';
import quizRoutes from './routes/quizzes.js';
import sessionRoutes from './routes/sessions.js';
import { registerSocketHandlers } from './socket/handlers.js';
import { startBatchTicker } from './services/gameEngine.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Dockerfile copies frontend dist to /app/frontend/dist (from /app/backend WORKDIR)
const frontendDist = path.join(__dirname, '../../frontend/dist');

console.log('[DEBUG] __dirname:', __dirname);
console.log('[DEBUG] frontendDist:', frontendDist);
console.log('[DEBUG] dist exists:', fs.existsSync(frontendDist));
if (fs.existsSync(frontendDist)) {
  console.log('[DEBUG] dist contents:', fs.readdirSync(frontendDist));
}

const app = express();

// Serve frontend static files
app.use(express.static(frontendDist));
const server = http.createServer(app);

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(compression());
app.use(
  cors({
    origin(origin, callback) {
      // Allow all origins if '*' is in corsOrigins
      if (env.corsOrigins.includes('*')) {
        return callback(null, true);
      }
      if (!origin || env.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('CORS not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use('/api', apiRateLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

app.use('/api/auth', authRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/sessions', sessionRoutes);

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) {
    return next();
  }
  res.sendFile(path.join(frontendDist, 'index.html'));
});

const io = new Server(server, {
  cors: {
    // Socket.IO expects true for wildcard, not '*'
    origin: env.corsOrigins.includes('*') ? true : env.corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 8000,
  perMessageDeflate: {
    threshold: 512,
  },
  transports: ['websocket', 'polling'],
});

io.adapter(createAdapter(pubClient, subClient));
registerSocketHandlers(io);
startBatchTicker(io);

async function bootstrap() {
  await runMigrations();
  server.listen(env.port, '0.0.0.0', () => {
    console.log(`[Server] QuizBlitz listening on port ${env.port} (${env.nodeEnv})`);
  });
}

bootstrap().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
