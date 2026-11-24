# Security Policy

## 🔒 Supported Versions

| Version | Supported |
|---------|-----------|
| Latest release | ✅ Yes |
| Previous minor | ✅ Security patches only |
| Older | ❌ No |

---

## 🛡 Security Features (Built-In)

| Layer | Protection |
|-------|------------|
| **Transport** | TLS 1.3 enforced, HSTS, secure cookies |
| **Authentication** | JWT (RS256), HttpOnly cookies, rotation, device binding |
| **Authorization** | Role-based (host/player), per-room scoping |
| **Input Validation** | Zod schemas on all API routes, sanitization |
| **Rate Limiting** | Express-rate-limit (API), per-connection (Socket.IO) |
| **XSS Prevention** | CSP headers, DOMPurify, output encoding |
| **SQL Injection** | Parameterized queries only (`pg` placeholders) |
| **Profanity Filter** | Nickname validation, customizable wordlist |
| **Dependencies** | Automated scanning (Dependabot + npm audit) |

---

## 🐛 Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

### Responsible Disclosure

1. **Email:** security@muchhad-quiz.cc.cd (or GitHub Security Advisory)
2. **Include:**
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. **Response time:** 48 hours acknowledgment, 7 days triage

### What Happens Next

| Timeline | Action |
|----------|--------|
| 0-48h | Acknowledgment + severity assessment |
| 1-7 days | Triage, reproduction, fix development |
| 7-30 days | Patch release (depending on severity) |
| Post-fix | Public advisory + CVE (if applicable) |

---

## 🏆 Scope & Rewards

### In Scope
- `muchhad-quiz.cc.cd` (production)
- `api.muchhad-quiz.cc.cd` (API)
- WebSocket endpoints
- Authentication/authorization logic
- Real-time game state manipulation

### Out of Scope
- Third-party services (Render, Northflank, Docker Hub)
- Client-side only issues (self-XSS, dev tools)
- Social engineering, phishing
- DoS/DDoS (infrastructure level)

### Recognition
- Hall of Fame in [SECURITY_HALL_OF_FAME.md](SECURITY_HALL_OF_FAME.md)
- Swag package (stickers, shirt) for valid reports
- No monetary bounty (bootstrapped, teacher-built)

---

## 🔐 Security Best Practices for Contributors

### Code Review Checklist
- [ ] No hardcoded secrets (use `.env.example` pattern)
- [ ] All inputs validated with Zod
- [ ] SQL uses parameterized queries (`$1, $2`)
- [ ] No `eval()`, `Function()`, `innerHTML` with user data
- [ ] CSP headers not weakened
- [ ] Rate limits appropriate for endpoint

### Dependency Management
```bash
# Audit before PR
npm audit --audit-level=high

# Update dependencies
npm update
# Test thoroughly before merging
```

### Secrets Handling
- **Never commit** `.env`, `.env.local`, `*.pem`, `*.key`
- Use `.env.example` for template
- Production secrets: Render/Northflank secret manager
- Rotate `JWT_SECRET` annually

---

## 📋 Incident Response Plan

| Phase | Action | Owner |
|-------|--------|-------|
| **Detect** | Monitoring alerts (Sentry, health checks) | On-call |
| **Triage** | Assess severity, isolate affected systems | Lead maintainer |
| **Contain** | Disable feature, revoke tokens, scale up | Team |
| **Eradicate** | Deploy fix, verify, monitor | Team |
| **Recover** | Restore service, communicate | Lead maintainer |
| **Learn** | Postmortem (blameless), update docs | Team |

**Postmortem template:** `docs/runbooks/postmortem-template.md`

---

## 📞 Contact

| Channel | Use For |
|---------|---------|
| `security@muchhad-quiz.cc.cd` | Vulnerability reports |
| GitHub Security Advisory | Coordinated disclosure |
| `hello@muchhad-quiz.cc.cd` | General security questions |

---

## 📜 Compliance

| Standard | Status |
|----------|--------|
| GDPR | ✅ Compliant (no personal data stored beyond necessity) |
| COPPA | ✅ Compliant (no accounts for under 13) |
| SOC 2 | 📋 Not certified (open source, self-hosted option) |
| ISO 27001 | 📋 Not certified |

---

**Last updated:** 2026-11-24  
**Next review:** 2027-02-24