# muchhad-quiz — Live Neo-Brutalist Quiz Platform

A production-ready Kahoot-style live quiz platform built with **React + Vite + Tailwind CSS + Framer Motion**, **Node.js + Express + Socket.IO**, **Redis (state + Socket.IO Redis Adapter)**, and **PostgreSQL**.

## 🎯 Features

- **Real-time multiplayer** — Socket.IO with Redis adapter for horizontal scaling
- **Host controls** — Start/pause/reveal/skip questions, lock room, kick/ban players
- **Player experience** — Join via 6-digit PIN or QR code, power-ups (50/50, 2x points), emoji reactions
- **Projector view** — Dedicated screen for displaying questions/leaderboard
- **Multi-language** — English, Hindi, Gujarati (i18n ready)
- **Result export** — Download PNG/CSV/PDF result cards
- **Neo-brutalist UI** — Bold, accessible, responsive design
- **Load tested** — k6 script for 200 concurrent players

## 📁 Project Structure

```
muchhad-quiz/
├── .env.example                 # Environment template
├── ARCHITECTURE.md              # Architecture, Socket.IO events, edge cases
├── Dockerfile                   # Multi-stage Docker build
├── docker-compose.yml           # Local dev stack (PostgreSQL + Redis + App + Nginx)
├── nginx/nginx.conf             # Reverse proxy with WebSocket upgrade
├── k6/load-test.js              # 200-player burst load test
├── render.yaml                  # Render Blueprint (free tier deploy)
├── northflank.yaml              # Northflank config
├── NORTHFLANK_DEPLOY.md         # Northflank deployment guide
├── RENDER_DEPLOY.md             # Render deployment guide
├── deploy-*.sh / .ps1           # Deploy helper scripts
├── backend/
│   ├── package.json
│   └── src/
│       ├── index.js             # Express + Socket.IO + Redis Adapter
│       ├── config/              # env, db, redis
│       ├── db/                  # migrate.js + SQL migrations
│       ├── middleware/          # JWT auth, rateLimit, sanitize + profanity filter
│       ├── routes/              # auth, quizzes, sessions
│       ├── services/            # roomStore, scoring, gameEngine (250ms batching)
│       └── socket/              # handlers.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── i18n/translations.js   # EN / HI / GU
        ├── utils/                 # soundFX, socket, api, exportUtils (CSV/PDF/PNG)
        ├── components/            # Avatar (10 SVGs), AnswerButton, ChunkyTimer, TopBarControls, JoinQRCode
        └── pages/                 # HomePage, HostDashboard, HostControlPanel, ProjectorScreen, PlayerApp
```

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### 1. Start Infrastructure
```bash
docker compose up -d postgres redis
```

### 2. Backend
```bash
cd backend
cp .env.example .env  # Update secrets
npm install
npm run migrate       # Runs SQL migrations
npm run dev           # Starts on :4000 with --watch
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev           # Starts Vite on :5173
```

### 4. Open App
Visit **http://localhost:5173**

## 🐳 Production Deployment (Docker Compose + Nginx)

```bash
cp .env.example .env
# Edit .env with production secrets
docker compose up --build -d
```

- App served at **http://localhost:8080** (configurable)
- WebSocket upgrade enabled on `/socket.io/`
- Nginx handles static files, API proxy, WebSocket proxy

## ☁️ Free Cloud Deployment

### Render (Recommended - No Credit Card)
1. Push to GitHub
2. Go to [dashboard.render.com](https://dashboard.render.com) → Sign up with GitHub
3. **New → Blueprint** → Connect repo → **Apply**
3. Auto-creates: Web Service + PostgreSQL + Redis Key Value
4. Live at `https://your-app.onrender.com`

### Northflank (No Credit Card)
1. Go to [app.northflank.com](https://app.northflank.com) → Sign up with GitHub
2. **New Project** → GitHub → Select repo
3. Add PostgreSQL addon (Free) + Redis addon (Free)
4. Set secrets: `jwt-secret`, `database-url`, `redis-url`, `public-host`
5. Deploy

## 🧪 Load Testing (200 Concurrent Players)

```bash
# 1. Start a live session as host, note PIN (e.g., 482910)
# 2. Run k6:
k6 run -e PIN=482910 k6/load-test.js

# 3. Start game on Host Control Panel
# 200 virtual players join and answer within 3 seconds
```

## 🔧 Environment Variables

### Backend (`.env`)
```env
NODE_ENV=production
PORT=4000
CORS_ORIGIN=*
DATABASE_URL=postgres://user:pass@host:5432/db
REDIS_URL=redis://host:6379
JWT_SECRET=64-char-random-string
JWT_EXPIRES_IN=12h
PUBLIC_HOST=your-domain.com
```

### Frontend (`.env` - optional)
```env
VITE_API_URL=http://localhost:4000
```

## 📡 Socket.IO Event Contract

### Host → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `host:join_room` | `{ pin, token }` | Host joins room |
| `host:start_game` | `{ pin }` | Start quiz |
| `host:pause_game` | `{ pin }` | Pause timer |
| `host:resume_game` | `{ pin }` | Resume timer |
| `host:reveal_answer` | `{ pin }` | Show correct answer |
| `host:skip_question` | `{ pin }` | Skip to next |
| `host:next_question` | `{ pin }` | Advance after reveal |
| `host:lock_room` | `{ pin, locked }` | Lock/unlock room |
| `host:kick_player` | `{ pin, sessionToken }` | Remove player |
| `host:ban_player` | `{ pin, sessionToken }` | Ban player |
| `host:end_game` | `{ pin }` | End session |

### Server → Host
| Event | Payload | Description |
|-------|---------|-------------|
| `room:state` | `{ status, locked, quizTitle, ... }` | Full room state |
| `lobby:players` | `{ players: [...] }` | Player list update |
| `question:start` | `{ index, text, options, timeLimit, endsAt }` | New question |
| `stats:batch` | `{ answeredCount, totalConnected }` | Answer counts (batched 250ms) |
| `question:reveal` | `{ correctIndex, top5: [...] }` | Answer reveal + leaderboard |
| `game:paused` | `{ remainingMs }` | Timer paused |
| `game:resumed` | `{ endsAt }` | Timer resumed |
| `room:locked` | `{ locked }` | Lock status changed |
| `game:podium` | `{ finalRankings: [...] }` | Final results |
| `error:toast` | `{ message }` | Error notification |

### Player → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `player:join` | `{ pin, nickname, avatarId, sessionToken? }` | Join/reconnect |
| `player:answer` | `{ pin, questionIndex, answer }` | Submit answer |
| `player:use_powerup` | `{ pin, questionIndex, type }` | 50/50 or 2x points |
| `player:reaction` | `{ pin, emoji }` | Emoji reaction |

### Server → Player
| Event | Payload | Description |
|-------|---------|-------------|
| `player:joined` | `{ nickname, avatarId, sessionToken, quizTitle, settings, roomStatus }` | Join confirmed |
| `question:start` | `{ index, text, options, timeLimit, endsAt, total, alreadyAnswered }` | New question |
| `player:powerup_result` | `{ type, hiddenIndices? }` | Power-up result |
| `player:answer_ack` | `{ locked }` | Answer received |
| `player:feedback` | `{ correct, pointsEarned, streak, rank, totalPlayers, isPoll }` | Answer feedback |
| `game:paused` | `{ remainingMs }` | Timer paused |
| `game:resumed` | `{ endsAt }` | Timer resumed |
| `player:final_rank` | `{ rank, score, correctCount, totalQuestions, totalPlayers }` | Final results |
| `player:kicked` | `{ reason }` | Removed from game |
| `error:toast` | `{ message }` | Error notification |

## 🏗 Architecture Highlights

- **Stateless backend** — Room state in Redis, horizontal scaling via Socket.IO Redis Adapter
- **250ms answer batching** — Reduces Socket.IO emissions, handles 200+ concurrent players
- **JWT auth** — HttpOnly cookies for host, token-based for players
- **Rate limiting** — Express-rate-limit on API, Socket.IO per-connection limits
- **Input sanitization** — XSS protection, profanity filter on nicknames
- **Migrations** — SQL migrations with checksum verification
- **Health checks** — `/api/health` for Docker/Render

## 🎨 UI/UX

- **Neo-brutalist design** — Bold borders, high contrast, no rounded corners
- **Responsive** — Mobile-first, works on all screen sizes
- **Accessible** — Semantic HTML, ARIA labels, keyboard navigation
- **Animations** — Framer Motion for smooth transitions
- **Sound effects** — Web Audio API for clicks, correct/wrong, podium

## 📦 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, React Router 6 |
| Backend | Node.js 20, Express 4, Socket.IO 4, PostgreSQL (pg), Redis (ioredis) |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Validation | express-rate-limit, xss, custom sanitize |
| Real-time | Socket.IO + Redis Adapter |
| Database | PostgreSQL 16, SQL migrations |
| Cache/State | Redis 7 |
| Build | Docker multi-stage, Vite |
| Proxy | Nginx (prod), Vite proxy (dev) |
| Testing | k6 load testing |

## 📄 License

MIT License — feel free to use for your own events!

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For issues, open a GitHub issue or check the deployment guides:
- [RENDER_DEPLOY.md](RENDER_DEPLOY.md)
- [NORTHFLANK_DEPLOY.md](NORTHFLANK_DEPLOY.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)