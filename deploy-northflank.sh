#!/bin/bash
# Deploy QuizBlitz to Northflank (free tier)

set -e

GITHUB_USERNAME=""
REPO_NAME="quizblitz"

echo "=== QuizBlitz Northflank Deployment Helper ==="
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "Initializing Git repository..."
    git init
    git add .
    git commit -m "QuizBlitz ready for Northflank"
    git branch -M main
else
    echo "Git repository already initialized"
fi

# Get GitHub username if not provided
if [ -z "$GITHUB_USERNAME" ]; then
    read -p "Enter your GitHub username: " GITHUB_USERNAME
fi

REPO_URL="https://github.com/$GITHUB_USERNAME/$REPO_NAME.git"

echo ""
echo "Repository URL: $REPO_URL"
echo ""

# Check if remote exists
REMOTE=$(git remote get-url origin 2>/dev/null || echo "")
if [ -z "$REMOTE" ]; then
    echo "Adding GitHub remote..."
    git remote add origin "$REPO_URL"
elif [ "$REMOTE" != "$REPO_URL" ]; then
    echo "Updating remote URL..."
    git remote set-url origin "$REPO_URL"
fi

# Commit any changes
echo "Committing latest changes..."
git add .
COMMIT_MSG="Deploy to Northflank - $(date '+%Y-%m-%d %H:%M')"
git commit -m "$COMMIT_MSG" 2>/dev/null || true

# Push to GitHub
echo "Pushing to GitHub..."
if git push -u origin main; then
    echo "✅ Pushed to GitHub successfully!"
else
    echo "❌ Push failed. You may need to:"
    echo "  1. Create repo at: https://github.com/new"
    echo "  2. Name it: $REPO_NAME"
    echo "  3. Don't initialize with README"
    echo "  4. Run this script again"
    exit 1
fi

echo ""
echo "=== Next Steps (Manual in Browser) ==="
echo ""
echo "1. Go to: https://app.northflank.com"
echo "2. Sign up (free, no credit card)"
echo "3. Click 'New Project' → Select GitHub → Choose '$REPO_NAME'"
echo "4. Add PostgreSQL addon (Free plan)"
echo "5. Add Redis addon (Free plan)"
echo "6. Copy connection URIs from addons"
echo "7. Set Secrets in Service 'app':"
echo "   - jwt-secret: (run 'openssl rand -hex 32' to generate)"
echo "   - database-url: (from PostgreSQL addon)"
echo "   - redis-url: (from Redis addon)"
echo "   - public-host: (your-app-name.northflank.app after deploy)"
echo "8. Click Deploy"
echo ""
echo "Full guide: NORTHFLANK_DEPLOY.md"
echo ""
echo "Your app will be at: https://your-app-name.northflank.app"