## 📝 Description

<!-- Describe what this PR does and why -->

## 🔗 Related Issues

<!-- Link issues: Closes #123, Fixes #456, Related to #789 -->

## 🎯 Type of Change

- [ ] 🐛 Bug fix
- [ ] ✨ New feature
- [ ] 📖 Documentation
- [ ] 🎨 Design/UI
- [ ] 🧪 Tests
- [ ] 🔧 Refactor/Chore
- [ ] 🌐 Translation
- [ ] 🔒 Security

## ✅ Checklist

### Code Quality
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes
- [ ] No `console.log` or debugger statements
- [ ] No commented-out code

### Design System
- [ ] Uses design tokens (CSS variables) — no hardcoded colors
- [ ] Uses Brutal components (`BrutalButton`, `BrutalCard`, etc.)
- [ ] Follows spacing scale (4px base)
- [ ] Touch targets ≥48px (56px primary mobile)
- [ ] WCAG AA contrast verified

### Accessibility
- [ ] Semantic HTML
- [ ] ARIA labels where needed
- [ ] Keyboard navigable
- [ ] Screen reader tested
- [ ] `prefers-reduced-motion` respected

### Internationalization
- [ ] No hardcoded strings — all wrapped in `t()`
- [ ] New strings added to `en.arb` (and `hi.arb`, `gu.arb` if possible)

### Dark Mode
- [ ] Tested in dark theme
- [ ] No hardcoded light-mode colors

### Mobile
- [ ] Tested on mobile viewport
- [ ] Responsive breakpoints work

### Documentation
- [ ] README updated (if user-facing)
- [ ] ARCHITECTURE.md updated (if architectural)
- [ ] CHANGELOG.md entry added
- [ ] Code comments for complex logic

### Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated (if API changes)
- [ ] E2E tests added/updated (if UI changes)
- [ ] Manual testing completed

## 📸 Screenshots / Videos

<!-- Drag and drop for UI changes -->

## 🧪 Testing Instructions

<!-- How to test this PR locally -->

```bash
# Steps to reproduce/test
1.
2.
3.
```

## ⚠️ Breaking Changes

<!-- List any breaking changes and migration steps -->

## 📋 Additional Notes

<!-- Anything else reviewers should know -->

---

## 👀 Reviewer Guidelines

- **Design system compliance** — Check tokens, components, spacing
- **Accessibility** — Keyboard, screen reader, contrast
- **Performance** — No unnecessary re-renders, bundle size
- **Security** — Input validation, no secrets, rate limits
- **Tests** — Coverage maintained or improved