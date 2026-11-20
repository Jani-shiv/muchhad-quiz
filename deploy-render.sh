#!/bin/bash
# Deploy QuizBlitz to Render (free tier, no credit card)

set -e

GITHUB_USERNAME="Jani-shiv"
REPO_NAME="Live-quiz"

echo "=== QuizBlitz Render Deployment Helper ==="
echo ""

# Check git status
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
    git add .
    git commit -m "QuizBlitz ready for Render"
    git branch -M main
else
    echo "Git repository already initialized"
fi

REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"
echo "Repository: $REPO_URL"

# Check remote
REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE" ]; then
    echo "Adding GitHub remote..."
    git remote add origin "$REPO_URL"
elif [ "$REMOTE" != "$REPO_URL" ]; then
    echo "Updating remote URL..."
    git remote set-url origin "$REPO_URL"
fi

# Commit & Push
echo "Committing & pushing..."
git add .
COMMIT_MSG="Deploy to Render - $(date '+%Y-%m-%d %H:%M')"
git commit -m "$COMMIT_MSG" 2>/dev/null || true

if git push -u origin main --force; then
    echo "✅ Pushed to GitHub!"
else
    echo "❌ Push failed. Create repo first at github.com/new"
    exit 1
fi

echo ""
echo "=== Render Deployment (No Credit Card) ==="
echo ""
echo "1. Go to: https://dashboard.render.com"
echo "2. Sign up with GitHub (OAuth, no card)"
echo "3. Choose deployment method:"
echo ""
echo "   METHOD A - Blueprint (Easiest):"
echo "   - New → Blueprint → Connect '$REPO_NAME' repo"
echo "   - Render reads render.yaml → Creates everything auto"
echo ""
echo "   METHOD B - Manual:"
echo "   - New → Web Service → Connect repo"
echo "   - Runtime: Docker, Port: 4000"
echo "   - New → PostgreSQL (Free) → Copy External URI → DATABASE_URL"
echo "   - New → Redis (Free) → Copy External URI → REDIS_URL"
echo "   - Web Service → Environment → Add 6 variables"
echo ""
echo "4. Environment Variables to set:"
echo "   NODE_ENV=production"
echo "   CORS_ORIGIN=*"
echo "   JWT_SECRET=(auto-generate in Render)"
echo "   DATABASE_URL=(from PostgreSQL)"
echo "   REDIS_URL=(from Redis)"
echo "   PUBLIC_HOST=(your-app.onrender.com after deploy)"
echo ""
echo "5. Deploy → Live at https://your-app.onrender.com"
echo ""
echo "Full guide: RENDER_DEPLOY.md"
echo ""
echo "⚠️ Free tier: 750 hrs/mo, spins down after 15min inactivity"
echo "⚠️ PostgreSQL/Redis expire after 90 days → Migrate to Neon/Upstash"