# Render Free Deployment Guide

**No credit card required** - Sign up with GitHub OAuth

---

## 🚀 One-Click Deploy (Recommended)

### Option A: render.yaml (Infrastructure as Code)

1. **Go to:** https://dashboard.render.com
2. **Sign up** with GitHub
3. **New** → **Blueprint** → Connect `Live-quiz` repo
4. Render detects `render.yaml` → **"Apply"**
5. Creates: Web Service + PostgreSQL + Redis automatically
6. **Deploy** → Live at `https://quizblitz-xxxx.onrender.com`

---

## 📋 Manual Step-by-Step

### 1. Create Web Service

1. **Dashboard** → **New** → **Web Service**
2. **Connect** GitHub → Select `Live-quiz`
3. **Settings:**
   ```
   Name: quizblitz
   Region: Oregon (US West)
   Branch: main
   Runtime: Docker
   Dockerfile Path: ./Dockerfile
   Docker Build Context: .
   Plan: Free
   Port: 4000
   Health Check Path: /api/health
   ```

### 2. Add Environment Variables

In **Environment** tab, add:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `CORS_ORIGIN` | `*` |
| `JWT_SECRET` | Click **"Generate"** (or run `openssl rand -hex 32`) |
| `PUBLIC_HOST` | `quizblitz-xxxx.onrender.com` (fill after deploy) |

### 3. Create PostgreSQL Database (Free 90 days)

1. **Dashboard** → **New** → **PostgreSQL**
2. **Settings:**
   ```
   Name: quizblitz-db
   Database: quizblitz
   User: quizblitz
   Region: Oregon
   Plan: Free
   ```
3. **Create** → Wait for "Available"
4. **Connections** tab → Copy **External Connection String** → This is your `DATABASE_URL`

### 4. Create Redis (Free 90 days)

1. **Dashboard** → **New** → **Redis**
2. **Settings:**
   ```
   Name: quizblitz-redis
   Region: Oregon
   Plan: Free
   Version: 7
   ```
3. **Create** → Wait for "Available"
4. **Connections** tab → Copy **External Connection String** → This is your `REDIS_URL`

### 5. Link Database & Redis to Web Service

1. Go to **Web Service** → **Environment**
2. Add two more variables:
   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Paste PostgreSQL External Connection String |
   | `REDIS_URL` | Paste Redis External Connection String |
3. **Save Changes** → Auto-redeploys

### 6. Update PUBLIC_HOST

1. After deploy: **Web Service** → **Settings** → Copy **URL** (e.g., `https://quizblitz-abc123.onrender.com`)
2. **Environment** → Edit `PUBLIC_HOST` → Paste URL
3. **Save** → Redeploys with correct join URLs

---

## 🎯 Your Live URLs

| Page | URL |
|------|-----|
| **Host Dashboard** | `https://your-app.onrender.com/host` |
| **Player Join** | `https://your-app.onrender.com/join/{PIN}` |
| **Projector** | `https://your-app.onrender.com/projector/{PIN}` |

---

## ⚠️ Free Tier Limits (Render)

| Resource | Limit |
|----------|-------|
| Web Service | 750 hours/month |
| PostgreSQL | 90 days (then auto-delete) |
| Redis | 90 days (then auto-delete) |
| Bandwidth | 100 GB/month |
| **Spin down** | After 15 min inactivity |
| **Wake time** | 30-60 seconds |

---

## 🔄 After 90 Days: Migrate DB/Redis

### PostgreSQL → Neon.tech (Free Forever)
1. **Sign up:** https://neon.tech (GitHub OAuth, no card)
2. **Create Project** → Copy connection string
3. **Render** → Web Service → Environment → Update `DATABASE_URL`
4. **Deploy**

### Redis → Upstash (Free Forever)
1. **Sign up:** https://upstash.com (GitHub OAuth, no card)
2. **Create Database** → Copy connection string
3. **Render** → Web Service → Environment → Update `REDIS_URL`
4. **Deploy**

---

## 🛠 Troubleshooting

### Build Fails
- Check **Logs** tab in Web Service
- Common: `Dockerfile` path wrong → Ensure `./Dockerfile`
- Ensure `PORT=4000` matches `EXPOSE 4000` in Dockerfile

### Database Connection Error
- Verify `DATABASE_URL` format: `postgresql://user:pass@host:port/db?sslmode=require`
- Check PostgreSQL is in same region (Oregon)

### WebSocket Issues
- Render supports WebSockets natively
- `CORS_ORIGIN=*` allows all origins

### App Spins Down
- Free tier sleeps after 15 min inactivity
- First request wakes it (30-60s)
- Use cron job to ping `/api/health` every 10 min:
  ```bash
  # Add to crontab (any always-on server)
  */10 * * * * curl -s https://your-app.onrender.com/api/health > /dev/null
  ```

---

## 📝 Quick Commands

```bash
# Generate JWT secret locally
openssl rand -hex 32

# Test locally before deploy
docker compose up --build -d

# View Render logs
# Dashboard → Web Service → Logs
```

---

## ✅ Deploy Checklist

- [ ] GitHub repo: `https://github.com/Jani-shiv/Live-quiz.git`
- [ ] Web Service created with Docker
- [ ] PostgreSQL created (Free)
- [ ] Redis created (Free)
- [ ] Environment variables set (6 total)
- [ ] Deploy successful
- [ ] `PUBLIC_HOST` updated with live URL
- [ ] Redeploy after `PUBLIC_HOST` update

---

## 🔗 Useful Links

- **Render Dashboard:** https://dashboard.render.com
- **Render Docs:** https://render.com/docs
- **Neon (PostgreSQL):** https://neon.tech
- **Upstash (Redis):** https://upstash.com