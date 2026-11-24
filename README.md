<div align="center">

# 🎮 Muchhad Quiz

### **Kahoot killer — Free, no-signup live quizzes for 150+ players**

[![Product Hunt Launch](https://img.shields.io/badge/Product%20Hunt-Launch%20Day-%23DA552E?style=for-the-badge&logo=producthunt&logoColor=white)](https://www.producthunt.com/posts/muchhad-quiz)
[![License: MIT](https://img.shields.io/badge/License-MIT-%23B8F2D0?style=for-the-badge&logo=opensourceinitiative&logoColor=%23111111)](LICENSE)
[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React 18](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=%23111111)](https://react.dev/)
[![TypeScript Ready](https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**Built by a teacher, for teachers. No VC. No tracking. No ads. Just a tool that works.**

[🚀 Try It Free](https://muchhad-quiz.cc.cd) • [📖 Docs](#-documentation) • [🐛 Report Bug](https://github.com/shiv712/Muchhad-Quiz/issues) • [✨ Request Feature](https://github.com/shiv712/Muchhad-Quiz/issues/new?template=feature_request.md)

---

</div>

---

## 🎯 The Problem

| Platform | Cost/Year | Player Cap | Requires Accounts | Tracking/Ads |
|----------|-----------|------------|-------------------|--------------|
| **Kahoot** | $120+ | 50 | ✅ Yes | ✅ Yes |
| **Quizizz** | $96+ | 100 | ✅ Yes | ✅ Yes |
| **Gimkit** | $60+ | 500 | ✅ Yes | ✅ Yes |
| **Muchhad Quiz** | **$0** | **Unlimited** | **❌ No** | **❌ No** |

**The breaking point:** My 120-student lecture hall. Kahoot capped at 50. Upgrade was $120/year. For a *quiz tool*.

---

## ✨ Features

### 🎮 Core Gameplay
- **Unlimited players** — Tested with **500+ simultaneous** connections
- **Zero friction** — 6-digit PIN or QR code, no accounts, no emails
- **Real-time everything** — Socket.IO + Redis adapter for horizontal scaling
- **250ms answer batching** — Handles burst traffic smoothly

### 🎨 Player Experience
- **Cartoon avatars** — 10 unique SVG characters, auto-assigned
- **Power-ups** — 50/50, 2x points, streak multipliers
- **Emoji reactions** — Live reactions during questions
- **Sound effects** — Web Audio API (clicks, correct/wrong, podium)
- **Multi-language** — English, Hindi, Gujarati (i18n ready)

### 🎛 Host Controls
- **Full game control** — Start/pause/reveal/skip/lock/kick/ban
- **Projector view** — Dedicated screen for questions/leaderboard
- **Live analytics** — Real-time answer counts, player tracking
- **Export results** — CSV/PDF/PNG result cards

### 🏗 Technical Excellence
- **Stateless backend** — Room state in Redis, horizontal scaling
- **JWT auth** — HttpOnly cookies (host) + token-based (players)
- **Rate limiting** — API + per-connection Socket.IO limits
- **Input sanitization** — XSS protection, profanity filter
- **SQL migrations** — Versioned, checksum-verified
- **Health checks** — `/api/health` for orchestration

---

## 🎨 Design System: Neo-Brutalism + Pastel

> **Bold, friendly, unmistakable** — Thick borders, hard shadows, chunky type, flat pastel fills.

### Color Tokens (Source of Truth)

| Token | Hex | Usage | WCAG AA |
|-------|-----|-------|---------|
| `--ink` | `#111111` | Text, borders, shadows | ✅ |
| `--paper` | `#FFFBF2` | App background (warm off-white) | ✅ |
| `--white` | `#FFFFFF` | Cards on tinted backgrounds | ✅ |
| `--mint` | `#B8F2D0` | Success, approved, primary action | ✅ |
| `--peach` | `#FFD3B6` | Warm accent, highlights | ✅ |
| `--lilac` | `#D9C6FF` | Secondary action, info | ✅ |
| `--sky` | `#BFE3FF` | Links, neutral info, visitors | ✅ |
| `--butter` | `#FFF1A8` | Warnings, pending, notices | ✅ |
| `--rose` | `#FFC2D1` | Deny, errors, SOS soft | ✅ |
| `--tomato` | `#FF5A4E` | Critical/SOS only (use sparingly) | ✅ |

### Shape & Shadow System

```
Border:        3px solid var(--ink)        (2px for dense lists)
Radius:        12px cards/buttons, 999px pills, 0 hero blocks
Shadow:        4px 4px 0 var(--ink)        (cards)
Shadow (hero): 6px 6px 0 var(--ink)        (modals)
Pressed:       translate(2px, 2px) + 2px 2px 0 shadow
Hover (web):   translate(-2px, -2px) + 6px 6px 0 shadow
Focus ring:    3px --ink outline + 3px --lilac outer ring
```

### Typography Scale

| Size | Use | Font |
|------|-----|------|
| 12px | Labels, chips | Inter / DM Sans 500 |
| 14px | Secondary text | Inter / DM Sans 400 |
| **16px** | **Body (min mobile)** | Inter / DM Sans 400 |
| 20px | Subheadings | Space Grotesk 600 |
| 24px | Headings | Space Grotesk 700 |
| 32px | Hero titles | Archivo Black 700 |
| 40px | Display | Archivo Black 700 |

**Numbers/OTP/Codes:** `JetBrains Mono` or `Space Mono`

### Core Components (Build Once, Reuse Everywhere)

| Component | Variants | Sizes |
|-----------|----------|-------|
| `BrutalButton` | Primary (mint), Secondary (lilac), Danger (rose), Ghost (white) | S / M / L / XL |
| `BrutalCard` | Flat pastel fill, thick border, hard shadow, optional 0.5–1° tilt | — |
| `BrutalInput` | Thick borders, focus ring, error state | — |
| `BrutalSelect` | Chunky dropdown, keyboard nav | — |
| `BrutalToggle` | Square knob, pastel fill | — |
| `BrutalChip` | Pill (999px radius), pastel + ink border | — |
| `BrutalBadge` | Status indicator, icon + label | — |
| `StatusStamp` | Rotated stamp: APPROVED/DENIED/PENDING | — |
| `OtpBoxes` | Big monospace, thick borders | 6-digit |
| `ApprovalSheet` | Full-width, photo + name + purpose, giant APPROVE/DENY | — |
| `ToastSticker` | Slides in like sticker, hard shadow | — |
| `EmptyState` | Flat illustration + bold line + one action | — |

### Motion Principles

- **Fast & snappy:** 120–180ms, ease-out
- **Allowed:** Press-down, slide-up sheets, sticker pop (0.9 → 1.05 → 1)
- **Respect:** `prefers-reduced-motion`
- **Haptics:** On approve/deny (mobile)

### Dark Mode (Non-Negotiable)

```css
:root[data-theme="dark"] {
  --paper: #161616;
  --ink: #FFFBF2;
  --white: #1E1E1E;
  /* Borders/shadows become pastel (--mint or --lilac) */
}
```

---

## 📸 Screenshots

<div align="center">

| Home / Create Quiz | Host Dashboard | Player Join |
|:---:|:---:|:---:|
| ![Home](docs/screenshots/home.png) | ![Host](docs/screenshots/host-dashboard.png) | ![Player](docs/screenshots/player-join.png) |

| Projector View | Live Game | Results / Podium |
|:---:|:---:|:---:|
| ![Projector](docs/screenshots/projector.png) | ![Live](docs/screenshots/live-game.png) | ![Results](docs/screenshots/results.png) |

</div>

> **Note:** Add screenshots to `docs/screenshots/` — they'll auto-render above.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** • **PostgreSQL 16+** • **Redis 7+**

### 1. Infrastructure (Docker)
```bash
docker compose up -d postgres redis
```

### 2. Backend
```bash
cd backend
cp .env.example .env   # Edit with your secrets
npm install
npm run migrate        # Runs SQL migrations
npm run dev            # Starts on :4000 with --watch
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev            # Starts Vite on :5173
```

### 4. Open App
Visit **http://localhost:5173** 🎉

---

## 🐳 Production Deployment

### Docker Compose + Nginx (Self-Hosted)
```bash
cp .env.example .env
# Edit .env with production secrets
docker compose up --build -d
```
- App at **http://localhost:8080** (configurable)
- WebSocket upgrade on `/socket.io/`
- Nginx: static files + API proxy + WebSocket proxy

### ☁️ Free Cloud (No Credit Card)

| Platform | Steps | Free Tier Includes |
|----------|-------|-------------------|
| **Render** | 1. Push to GitHub 2. Dashboard → Blueprint → Apply | Web Service + PostgreSQL + Redis |
| **Northflank** | 1. New Project → GitHub 2. Add PostgreSQL + Redis addons | All managed services |

**Live in 5 minutes.** See [RENDER_DEPLOY.md](RENDER_DEPLOY.md) • [NORTHFLANK_DEPLOY.md](NORTHFLANK_DEPLOY.md)

---

## 🧪 Load Testing (200+ Concurrent Players)

```bash
# 1. Start a live session as host, note PIN (e.g., 482910)
# 2. Run k6:
k6 run -e PIN=482910 k6/load-test.js

# 3. Start game on Host Control Panel
# 200 virtual players join and answer within 3 seconds
```

**Results:** <100ms p95 latency, 0% error rate at 200 concurrent.

---

## 📁 Project Structure

```
Muchhad-Quiz/
├── .env.example                 # Environment template
├── .github/
│   ├── workflows/               # CI/CD (lint, test, build, deploy)
│   ├── ISSUE_TEMPLATE/          # Bug report, feature request
│   └── pull_request_template.md
├── docs/
│   ├── screenshots/             # Auto-rendered in README
│   ├── adr/                     # Architecture Decision Records
│   └── runbooks/                # Incident response
├── ARCHITECTURE.md              # Deep dive: Socket.IO events, edge cases
├── Dockerfile                   # Multi-stage build
├── docker-compose.yml           # Local: PostgreSQL + Redis + App + Nginx
├── nginx/nginx.conf             # Reverse proxy + WebSocket upgrade
├── k6/load-test.js              # 200-player burst load test
├── render.yaml                  # Render Blueprint
├── northflank.yaml              # Northflank config
├── LICENSE                      # MIT
├── CONTRIBUTING.md              # Contribution guide
├── CODE_OF_CONDUCT.md           # Community standards
├── SECURITY.md                  # Vulnerability disclosure
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── index.ts             # Express + Socket.IO + Redis Adapter
│       ├── config/              # env, db, redis, validation
│       ├── db/                  # migrate.ts + SQL migrations
│       ├── middleware/          # JWT auth, rateLimit, sanitize, profanity
│       ├── routes/              # auth, quizzes, sessions, health
│       ├── services/            # roomStore, scoring, gameEngine (250ms)
│       ├── socket/              # handlers.ts (typed events)
│       ├── utils/               # jwt, crypto, validators
│       └── types/               # Shared TypeScript types
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── vite.config.ts
    ├── tailwind.config.ts       # Design tokens → CSS vars
    ├── postcss.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── i18n/                # EN / HI / GU (ARB format)
        ├── styles/
        │   ├── globals.css      # CSS variables from tokens
        │   └── brutal.css       # Component base styles
        ├── components/
        │   ├── ui/              # BrutalButton, BrutalCard, BrutalInput...
        │   ├── game/            # Avatar, AnswerButton, ChunkyTimer...
        │   └── layout/          # TopBarControls, JoinQRCode...
        ├── pages/               # HomePage, HostDashboard, HostControlPanel...
        ├── hooks/               # useSocket, useGameState, useLocalization
        ├── utils/               # soundFX, api, exportUtils (CSV/PDF/PNG)
        └── types/               # Frontend types
```

---

## 📡 Socket.IO Event Contract (Typed)

### Host → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `host:join_room` | `{ pin, token }` | Host joins room |
| `host:start_game` | `{ pin }` | Start quiz |
| `host:pause_game` | `{ pin }` | Pause timer |
| `host:reveal_answer` | `{ pin }` | Show correct answer |
| `host:skip_question` | `{ pin }` | Skip to next |
| `host:lock_room` | `{ pin, locked }` | Lock/unlock room |
| `host:kick_player` | `{ pin, sessionToken }` | Remove player |
| `host:end_game` | `{ pin }` | End session |

### Server → Host
| Event | Payload | Description |
|-------|---------|-------------|
| `room:state` | `{ status, locked, quizTitle, ... }` | Full room state |
| `lobby:players` | `{ players: [...] }` | Player list update |
| `question:start` | `{ index, text, options, timeLimit, endsAt }` | New question |
| `stats:batch` | `{ answeredCount, totalConnected }` | Answer counts (250ms batch) |
| `question:reveal` | `{ correctIndex, top5: [...] }` | Answer reveal + leaderboard |
| `game:podium` | `{ finalRankings: [...] }` | Final results |

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
| `player:joined` | `{ nickname, avatarId, sessionToken, quizTitle, settings }` | Join confirmed |
| `question:start` | `{ index, text, options, timeLimit, endsAt, total }` | New question |
| `player:feedback` | `{ correct, pointsEarned, streak, rank, totalPlayers }` | Answer feedback |
| `player:final_rank` | `{ rank, score, correctCount, totalQuestions }` | Final results |

---

## 🏗 Architecture Highlights

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Host UI   │  │  Projector  │  │   Player Mobile     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
└─────────┼────────────────┼─────────────────────┼─────────────┘
          │                │                     │
          ▼                ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                     NGINX (Layer 7)                          │
│  Static Files  │  API Proxy  │  WebSocket Upgrade (/socket.io)│
└─────────────────┬───────────────────────────────────────────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
┌─────────────────┐ ┌─────────────────┐
│  BACKEND #1     │ │  BACKEND #2     │  (Horizontal scaling)
│  Express +      │ │  Express +      │
│  Socket.IO      │ │  Socket.IO      │
└────────┬────────┘ └────────┬────────┘
         │                   │
         └─────────┬─────────┘
                   ▼
        ┌─────────────────────┐
        │  REDIS CLUSTER      │
        │  • Room state       │
        │  • Pub/Sub adapter  │
        │  • Session cache    │
        └─────────┬───────────┘
                  │
         ┌────────┴────────┐
         ▼                 ▼
┌─────────────────┐ ┌─────────────────┐
│  POSTGRESQL     │ │  POSTGRESQL     │
│  (Primary)      │ │  (Replica)      │
│  • Users        │ │  • Read queries │
│  • Quizzes      │ │  • Analytics    │
│  • Sessions     │ │                 │
└─────────────────┘ └─────────────────┘
```

- **Stateless backend** — Room state in Redis, scale horizontally
- **250ms answer batching** — Reduces Socket.IO emissions 4x
- **JWT auth** — HttpOnly cookies (host) + token-based (players)
- **Rate limiting** — Express-rate-limit + Socket.IO per-connection
- **Input sanitization** — XSS protection, profanity filter on nicknames
- **SQL migrations** — Versioned, checksum-verified, rollback-safe
- **Health checks** — `/api/health` for Docker/Render/K8s

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React + Vite + TypeScript | 18 / 5 / 5 |
| **Styling** | Tailwind CSS + CSS Variables | 3.4 |
| **Animation** | Framer Motion | 11 |
| **Routing** | React Router | 6 |
| **Internationalization** | Custom ARB-based i18n | — |
| **Backend** | Node.js + Express + TypeScript | 20 / 4 / 5 |
| **Real-time** | Socket.IO + Redis Adapter | 4 / 7 |
| **Database** | PostgreSQL + `pg` | 16 |
| **Cache/State** | Redis + `ioredis` | 7 |
| **Auth** | JWT (`jsonwebtoken`) + `bcryptjs` | — |
| **Validation** | Zod + express-rate-limit + xss | — |
| **Build** | Docker multi-stage + Vite | — |
| **Proxy** | Nginx (prod) / Vite proxy (dev) | — |
| **Testing** | k6 (load) + Vitest (unit) | — |
| **CI/CD** | GitHub Actions | — |

---

## 🌍 Internationalization

| Language | Code | Status | Contributors |
|----------|------|--------|--------------|
| English | `en` | ✅ Complete | @shiv712 |
| Hindi | `hi` | ✅ Complete | @shiv712 |
| Gujarati | `gu` | ✅ Complete | @shiv712 |
| *Your language* | — | 🤝 Welcome | **You?** |

**Add a language:** Copy `src/i18n/en.arb` → `src/i18n/{code}.arb`, translate, PR.

---

## 📦 Environment Variables

### Backend (`backend/.env`)
```env
# App
NODE_ENV=production
PORT=4000
CORS_ORIGIN=https://your-domain.com

# Database
DATABASE_URL=postgres://user:pass@host:5432/db?sslmode=require

# Redis
REDIS_URL=redis://host:6379

# Auth
JWT_SECRET=64-char-cryptographically-random-string
JWT_EXPIRES_IN=12h
JWT_REFRESH_EXPIRES_IN=7d

# Public
PUBLIC_HOST=your-domain.com

# Optional
SENTRY_DSN=
LOG_LEVEL=info
```

### Frontend (`frontend/.env`)
```env
VITE_API_URL=https://api.your-domain.com
VITE_SOCKET_URL=https://api.your-domain.com
```

---

## 📄 License

**MIT License** — Feel free to use for your own events, classrooms, companies, or communities!

See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

We ❤️ contributions! This is a **teacher-built, community-driven** project.

### Quick Start
```bash
# 1. Fork & clone
git clone https://github.com/YOUR_USERNAME/Muchhad-Quiz.git

# 2. Create branch
git checkout -b feature/amazing-feature

# 3. Make changes (follow code style)
npm run lint && npm run typecheck

# 4. Test
npm run test

# 5. Commit (Conventional Commits)
git commit -m "feat: add amazing feature"

# 6. Push & PR
git push origin feature/amazing-feature
```

### Guidelines
- 📝 **Follow the design system** — Use `BrutalButton`, `BrutalCard`, etc.
- 🎨 **Respect tokens** — Never hardcode colors; use CSS variables
- ♿ **Accessibility first** — Semantic HTML, ARIA, keyboard nav, 4.5:1 contrast
- 🌐 **i18n ready** — Wrap all strings in `t()` function
- 🧪 **Test your changes** — Unit + integration where applicable
- 📖 **Update docs** — README, ARCHITECTURE.md, ADRs for decisions

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guide.

---

## 🛡 Security

**Responsible disclosure:** See [SECURITY.md](SECURITY.md)

- No tracking, no analytics, no third-party scripts
- Input sanitization on all user content
- Rate limiting on all endpoints
- JWT with HttpOnly cookies + rotation
- SQL injection prevention via parameterized queries
- XSS protection via CSP headers + sanitization

---

## 🙏 Acknowledgments

- **Teachers** who beta-tested and gave feedback
- **Open source** libraries that made this possible
- **Product Hunt community** for the launch support 🚀

---

## 📞 Support & Links

| Resource | Link |
|----------|------|
| **Live Demo** | https://muchhad-quiz.cc.cd |
| **Product Hunt** | https://www.producthunt.com/posts/muchhad-quiz |
| **Documentation** | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Deployment (Render)** | [RENDER_DEPLOY.md](RENDER_DEPLOY.md) |
| **Deployment (Northflank)** | [NORTHFLANK_DEPLOY.md](NORTHFLANK_DEPLOY.md) |
| **Bug Reports** | [GitHub Issues](https://github.com/shiv712/Muchhad-Quiz/issues) |
| **Feature Requests** | [GitHub Issues](https://github.com/shiv712/Muchhad-Quiz/issues/new?template=feature_request.md) |
| **Discussions** | [GitHub Discussions](https://github.com/shiv712/Muchhad-Quiz/discussions) |

---

<div align="center">

**Built with ☕ and 🧠 by a teacher who got tired of paywalls.**

*If Muchhad Quiz helps your classroom, team, or community — ⭐ the repo and share it!*

</div>