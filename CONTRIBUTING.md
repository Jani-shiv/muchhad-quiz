# Contributing to Muchhad Quiz

> **Thank you for contributing!** This project is built by a teacher, for teachers — every contribution helps classrooms worldwide.

---

## 🎯 Ways to Contribute

| Type | Description | Difficulty |
|------|-------------|------------|
| 🐛 **Bug fixes** | Fix issues, improve stability | Easy |
| ✨ **Features** | New game modes, question types, integrations | Medium |
| 🌐 **Translations** | Add languages (ARB format) | Easy |
| 🎨 **Design** | Components, screens, accessibility | Medium |
| 📖 **Documentation** | Guides, API docs, tutorials | Easy |
| 🧪 **Testing** | Unit, integration, load tests | Medium |
| 🔧 **DevEx** | Tooling, CI/CD, local setup | Easy |

---

## 🚀 Getting Started

### 1. Fork & Clone
```bash
git clone https://github.com/YOUR_USERNAME/Muchhad-Quiz.git
cd Muchhad-Quiz
```

### 2. Set Up Local Environment
```bash
# Infrastructure
docker compose up -d postgres redis

# Backend
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### 3. Verify
- Frontend: http://localhost:5173
- Backend health: http://localhost:4000/api/health

---

## 📝 Development Workflow

### Branch Naming
```
feat/short-description     # New feature
fix/short-description      # Bug fix
docs/short-description     # Documentation
refactor/short-description # Code improvement
test/short-description     # Tests
chore/short-description    # Maintenance
```

### Commit Messages (Conventional Commits)
```
feat: add team battle mode
fix: handle player reconnection race condition
docs: update Socket.IO event contract
refactor: extract gameEngine to separate service
test: add unit tests for scoring service
chore: update dependencies
```

### Code Style
```bash
# Run before committing
npm run lint        # ESLint + Prettier
npm run typecheck   # TypeScript strict mode
npm run test        # Unit tests
```

**Frontend:** Uses shared design system — **never hardcode colors**, use CSS variables from `src/styles/globals.css`

**Backend:** Strict TypeScript, Zod validation on all inputs, parameterized SQL queries

---

## 🎨 Design System Rules

| Rule | Enforcement |
|------|-------------|
| Use design tokens | CSS variables only (`var(--mint)`, `var(--ink)`) |
| Use Brutal components | `BrutalButton`, `BrutalCard`, `BrutalInput` |
| Respect spacing scale | 4px base: 4, 8, 12, 16, 24, 32, 48 |
| Touch targets ≥48px | 56px for primary mobile actions |
| WCAG AA contrast | 4.5:1 minimum, test with `axe-core` |
| Dark mode support | All components must work in dark theme |

---

## 🌐 Adding Translations

1. Copy `frontend/src/i18n/en.arb` → `frontend/src/i18n/{code}.arb`
2. Translate all values (keep keys identical)
3. Add to `frontend/src/i18n/index.ts` exports
4. Test: `npm run dev` → switch language in UI

**Format:** ARB (Application Resource Bundle) — JSON with metadata

```json
{
  "joinGame": "Join Game",
  "@joinGame": {
    "description": "Button to join a quiz game"
  }
}
```

---

## 🧪 Testing Requirements

| Type | Tool | Coverage Target |
|------|------|-----------------|
| Unit | Vitest | 80% on services/utils |
| Integration | Vitest + Testcontainers | All API routes |
| E2E | Playwright | Critical user flows |
| Load | k6 | 200 concurrent players |

```bash
# Run all tests
npm run test           # Unit
npm run test:integration
npm run test:e2e
npm run test:load      # Requires running session
```

---

## 📋 Pull Request Checklist

- [ ] **Description** explains *what* and *why*
- [ ] **Tests pass** (`npm run test && npm run lint && npm run typecheck`)
- [ ] **Design system** followed (tokens, components, spacing)
- [ ] **Accessibility** verified (keyboard, screen reader, contrast)
- [ ] **i18n** — No hardcoded strings, all wrapped in `t()`
- [ ] **Dark mode** tested
- [ ] **Mobile** responsive tested
- [ ] **Documentation** updated if needed
- [ ] **Changelog** entry added (if user-facing)

---

## 🏷 Release Process

Maintainers only:

1. Update version in `package.json` (semver)
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.2.3`
4. Push tag: `git push origin v1.2.3`
5. GitHub Action builds & deploys

---

## 💬 Communication

| Channel | Purpose |
|---------|---------|
| GitHub Issues | Bugs, features, questions |
| GitHub Discussions | Ideas, help, showcase |
| PR Reviews | Code feedback, mentorship |

**Be kind, be constructive.** We're all here to help teachers.

---

## 🙏 Recognition

All contributors listed in:
- [GitHub Contributors](https://github.com/shiv712/Muchhad-Quiz/graphs/contributors)
- Release notes
- Annual "Thank You" post

---

## ❓ Questions?

Open a [Discussion](https://github.com/shiv712/Muchhad-Quiz/discussions) or [Issue](https://github.com/shiv712/Muchhad-Quiz/issues) — we're happy to help!