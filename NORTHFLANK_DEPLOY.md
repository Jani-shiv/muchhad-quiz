# Northflank Free Deployment Guide

## Prerequisites
- GitHub account (free)
- Northflank account (free, no credit card) → [northflank.com](https://northflank.com)

---

## Step 1: Push to GitHub

```bash
cd muchhad-quiz
git init
git add .
git commit -m "muchhad-quiz ready for Northflank"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/Live-quiz.git
git push -u origin main
```

---

## Step 2: Create Northflank Project

1. Go to [app.northflank.com](https://app.northflank.com)
2. Click **"New Project"**
3. Name: `muchhad-quiz`
4. Select **GitHub** → Choose your `Live-quiz` repo
5. Click **"Create Project"**

---

## Step 3: Add PostgreSQL Addon (Free)

1. In project dashboard → **"Addons"** tab
2. Click **"New Addon"**
3. Type: **PostgreSQL**
4. Name: `postgres`
5. Plan: **Free** (1GB storage, 128MB RAM)
6. Click **"Create"**

---

## Step 4: Add Redis Addon (Free)

1. In project dashboard → **"Addons"** tab
2. Click **"New Addon"**
3. Type: **Redis**
4. Name: `redis`
5. Plan: **Free** (128MB RAM)
6. Click **"Create"**

---

## Step 5: Configure Secrets

Go to **Services** → **app** → **Environment** → **Secrets**, add:

| Secret Key | Value | Description |
|------------|-------|-------------|
| `jwt-secret` | `your-64-char-random-string` | Generate: `openssl rand -hex 32` |
| `database-url` | *Auto-filled by PostgreSQL addon* | Copy from PostgreSQL addon → "Connection URI" |
| `redis-url` | *Auto-filled by Redis addon* | Copy from Redis addon → "Connection URI" |
| `public-host` | `your-app-name.northflank.app` | Your Northflank service URL (see Step 6) |

**To get addon connection URIs:**
1. Click on `postgres` addon → **Connection** tab → Copy "External URI"
2. Click on `redis` addon → **Connection** tab → Copy "External URI"

---

## Step 6: Deploy the Service

1. Go to **Services** → **app**
2. The `northflank.yaml` will be detected automatically
3. Click **"Deploy"**

**Wait for build to complete** (2-3 minutes)

---

## Step 7: Get Your Public URL

After deploy succeeds:
1. Go to **Services** → **app** → **Overview**
2. Copy the **Service URL** (e.g., `https://muchhad-quiz-abc123.northflank.app`)

**Update the `public-host` secret** with this URL.

---

## Step 8: Redeploy (Optional)

If you updated `public-host`:
1. Go to **Services** → **app**
2. Click **"Redeploy"** → **"Deploy latest commit"**

---

## Your App URLs

| Purpose | URL |
|---------|-----|
| **Host Dashboard** | `https://your-app.northflank.app/host` |
| **Player Join** | `https://your-app.northflank.app/join/{PIN}` |
| **Projector** | `https://your-app.northflank.app/projector/{PIN}` |

---

## Free Tier Limits (Northflank)

| Resource | Limit |
|----------|-------|
| Services | 2 (you use 1) |
| RAM per service | 1 GB |
| CPU per service | 0.5 vCPU |
| PostgreSQL | 1 GB storage |
| Redis | 128 MB |
| Bandwidth | Unlimited |
| **Sleep** | After 24h inactivity (wakes on request) |

---

## Troubleshooting

### Build Fails
```bash
# Check build logs in Northflank dashboard
# Common fix: Ensure Dockerfile uses correct Node version
```

### Database Connection Error
- Verify `database-url` secret matches PostgreSQL addon URI
- Ensure addon is in same project

### WebSocket Issues
- Northflank supports WebSockets natively
- Check `CORS_ORIGIN=*` is set

### App Sleeps
- Free tier spins down after 24h inactivity
- First request wakes it up (10-30s delay)
- Use a cron job to ping `/api/health` every 20 min if needed

---

## Quick Commands

```bash
# Generate JWT secret
openssl rand -hex 32

# Test locally before deploy
docker compose up --build -d

# View Northflank logs
# Dashboard → Services → app → Logs
```

---

## Done! 🎉

Your muchhad-quiz is now live at `https://your-app.northflank.app` with:
- ✅ PostgreSQL database (free)
- ✅ Redis for WebSocket scaling (free)
- ✅ HTTPS & custom domain support
- ✅ WebSocket support for real-time quiz
- ✅ Accessible from anywhere