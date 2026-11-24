# Changelog

All notable changes to Muchhad Quiz are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Product Hunt launch configuration and assets
- Comprehensive open source documentation (CONTRIBUTING, SECURITY, CODE_OF_CONDUCT)
- GitHub Actions CI/CD pipeline with full test suite
- Issue templates for bugs and features

### Changed
- README completely rewritten with full design system documentation
- Tagline updated to "Kahoot killer: Free, no-signup live quizzes for 150+ players"

---

## [1.0.0] - 2026-11-24

### 🎉 Major Release — Product Hunt Launch

### Added
- **Core Gameplay**
  - Real-time multiplayer quiz engine (Socket.IO + Redis)
  - Host controls: start/pause/reveal/skip/lock/kick/ban
  - Player join via 6-digit PIN or QR code
  - Projector view for classroom display
  - Power-ups: 50/50, 2x points, streak multipliers
  - Emoji reactions during gameplay

- **Player Experience**
  - 10 unique cartoon SVG avatars
  - Sound effects (Web Audio API)
  - Multi-language: English, Hindi, Gujarati
  - Result export: CSV, PDF, PNG
  - Real-time leaderboard with podium celebrations

- **Technical Foundation**
  - Stateless backend with Redis room state
  - 250ms answer batching for scale
  - JWT auth (HttpOnly cookies + token rotation)
  - Rate limiting (API + per-connection)
  - Input sanitization + profanity filter
  - SQL migrations with checksums
  - Health checks for orchestration

- **Infrastructure**
  - Docker multi-stage builds
  - Nginx reverse proxy with WebSocket upgrade
  - Render Blueprint (free tier deploy)
  - Northflank configuration
  - k6 load test (200 concurrent players)

- **Design System: Neo-Brutalism + Pastel**
  - 10 color tokens (--ink, --paper, --mint, --peach, --lilac, --sky, --butter, --rose, --tomato)
  - 3px borders, 12px radius, hard shadows (4px 4px 0)
  - Space Grotesk + Inter typography
  - 12 reusable components (BrutalButton, BrutalCard, etc.)
  - Dark mode support
  - WCAG AA compliance

### Security
- No tracking, analytics, or third-party scripts
- CSP headers, XSS protection
- Parameterized SQL queries
- Secure JWT implementation

---

## [0.9.0] - 2026-11-15

### Added
- Teacher beta program (50 classrooms)
- Quiz library with 10,000+ community quizzes
- CSV export for grading
- Custom quiz builder with rich text

### Fixed
- Player reconnection race condition
- Timer drift on slow networks
- Avatar assignment collisions

---

## [0.8.0] - 2026-11-01

### Added
- Multi-language support (EN/HI/GU)
- Projector view
- Power-ups system
- Emoji reactions

### Changed
- Migrated from polling to Socket.IO
- Improved mobile responsive layout

---

## [0.7.0] - 2026-10-15

### Added
- Host dashboard with quiz management
- Question types: MCQ, True/False, Poll
- Timer configuration per question
- Room lock/unlock

### Fixed
- Memory leak in room store
- WebSocket cleanup on disconnect

---

## [0.6.0] - 2026-10-01

### Added
- JWT authentication
- PostgreSQL persistence
- Redis session cache
- Rate limiting

### Changed
- Complete backend rewrite (Express + TypeScript)
- SQL migrations system

---

## [0.5.0] - 2026-09-15

### Added
- Real-time multiplayer prototype
- Basic host/player flows
- 6-digit PIN join

### Known Issues
- No persistence (in-memory only)
- Single-server only
- No authentication

---

## [0.1.0] - 2026-08-01

### Added
- Initial concept prototype
- React + Vite frontend
- Basic quiz creation UI

---

## 📅 Release Schedule

| Version | Target Date | Focus |
|---------|-------------|-------|
| 1.1.0 | 2026-12-15 | Team modes, question types |
| 1.2.0 | 2027-01-15 | LMS integrations (Google Classroom, Canvas) |
| 1.3.0 | 2027-02-15 | White-label for schools |
| 2.0.0 | 2027-04-01 | Major architecture + plugin system |

---

## 🏷 Versioning Policy

- **Major** — Breaking API changes, major architecture shifts
- **Minor** — New features, backward compatible
- **Patch** — Bug fixes, security patches, docs

**Pre-releases:** `1.1.0-beta.1`, `1.1.0-rc.1`

---

## 🔗 Links

- [GitHub Releases](https://github.com/shiv712/Muchhad-Quiz/releases)
- [Product Hunt Launch](https://www.producthunt.com/posts/muchhad-quiz)
- [Milestone Board](https://github.com/shiv712/Muchhad-Quiz/milestones)