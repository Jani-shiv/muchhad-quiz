# QuizBlitz — Live Neo-Brutalist Quiz Platform

A production-ready Kahoot-style live quiz platform built with **React + Vite + Tailwind CSS + Framer Motion**, **Node.js + Express + Socket.IO**, **Redis (state + Socket.IO Redis Adapter)**, and **PostgreSQL**.

## Folder Structure

```
quizblitz/
├── .env.example
├── ARCHITECTURE.md           # Architecture, Socket.IO Event Contract & Edge Cases
├── Dockerfile
├── docker-compose.yml
├── nginx/nginx.conf
├── k6/load-test.js           # 200-player burst load test
├── backend/
│   ├── package.json
│   └── src/
│       ├── index.js          # Express + Socket.IO + Redis Adapter
│       ├── config/           # env, db, redis
│       ├── db/               # migrate.js + SQL migrations
│       ├── middleware/       # JWT auth, rateLimit, sanitize + profanity filter
│       ├── routes/           # auth, quizzes, sessions
│       ├── services/         # roomStore, scoring, gameEngine (250ms batching)
│       └── socket/           # handlers.js
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── i18n/translations.js   # EN / HI / GU
        ├── utils/                 # soundFX, socket, api, exportUtils (CSV/PDF/PNG)
        ├── components/            # Avatar (10 SVGs), AnswerButton, ChunkyTimer, TopBarControls
        └── pages/                 # HomePage, HostDashboard, HostControlPanel, ProjectorScreen, PlayerApp
```

## Quick Start (Local Development)

1. Start PostgreSQL and Redis (or run `docker compose up -d postgres redis`).
2. Copy `.env.example` to `backend/.env` and update secrets.
3. Run backend:
   ```bash
   cd backend
   npm install
   npm run migrate
   npm run dev
   ```
4. Run frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
5. Open `http://localhost:5173`.

## Production Deployment (Docker Compose + Nginx)

```bash
cp .env.example .env
# Build frontend dist into nginx volume or copy dist, then:
docker compose up --build -d
```

App is served at `http://localhost:8080` with WebSocket upgrade enabled on `/socket.io/`.

## Load Testing (200 Concurrent Players)

1. Start a live session as a host and note the 6-digit PIN (e.g., `482910`).
2. Run k6:
   ```bash
   k6 run -e PIN=482910 k6/load-test.js
   ```
3. Start the game on the Host Control Panel; 200 virtual players will join and answer each question within 3 seconds.
