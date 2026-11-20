<# 
.SYNOPSIS
    Deploy Muchhad-Quiz to Render (free tier, no credit card)
.DESCRIPTION
    Pushes to GitHub and provides Render setup instructions
#>

param(
    [string]$GitHubUsername = "Jani-shiv",
    [string]$RepoName = "Muchhad-Quiz"
)

Write-Host "=== Muchhad-Quiz Render Deployment Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check git status
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "Muchhad-Quiz ready for Render"
    git branch -M main
} else {
    Write-Host "Git repository already initialized" -ForegroundColor Green
}

$repoUrl = "https://github.com/$GitHubUsername/$RepoName.git"
Write-Host "Repository: $repoUrl" -ForegroundColor Cyan

# Check remote
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "Adding GitHub remote..." -ForegroundColor Yellow
    git remote add origin $repoUrl
} elseif ($remote -ne $repoUrl) {
    Write-Host "Updating remote URL..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
}

# Commit & Push
Write-Host "Committing & pushing..." -ForegroundColor Yellow
git add .
$commitMsg = "Deploy to Render - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git commit -m $commitMsg 2>$null

try {
    git push -u origin main --force
    Write-Host "✅ Pushed to GitHub!" -ForegroundColor Green
} catch {
    Write-Host "❌ Push failed. Create repo first at github.com/new" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Render Deployment (No Credit Card) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://dashboard.render.com" -ForegroundColor White
Write-Host "2. Sign up with GitHub (OAuth, no card)" -ForegroundColor White
Write-Host "3. Choose deployment method:" -ForegroundColor White
Write-Host ""
Write-Host "   METHOD A - Blueprint (Easiest):" -ForegroundColor Yellow
Write-Host "   - New → Blueprint → Connect '$RepoName' repo" -ForegroundColor White
Write-Host "   - Render reads render.yaml → Creates everything auto" -ForegroundColor White
Write-Host ""
Write-Host "   METHOD B - Manual:" -ForegroundColor Yellow
Write-Host "   - New → Web Service → Connect repo" -ForegroundColor White
Write-Host "   - Runtime: Docker, Port: 4000" -ForegroundColor White
Write-Host "   - New → PostgreSQL (Free) → Copy External URI → DATABASE_URL" -ForegroundColor White
Write-Host "   - New → Redis (Free) → Copy External URI → REDIS_URL" -ForegroundColor White
Write-Host "   - Web Service → Environment → Add 6 variables" -ForegroundColor White
Write-Host ""
Write-Host "4. Environment Variables to set:" -ForegroundColor Cyan
Write-Host "   NODE_ENV=production" -ForegroundColor White
Write-Host "   CORS_ORIGIN=*" -ForegroundColor White
Write-Host "   JWT_SECRET=(auto-generate in Render)" -ForegroundColor White
Write-Host "   DATABASE_URL=(from PostgreSQL)" -ForegroundColor White
Write-Host "   REDIS_URL=(from Redis)" -ForegroundColor White
Write-Host "   PUBLIC_HOST=(your-app.onrender.com after deploy)" -ForegroundColor White
Write-Host ""
Write-Host "5. Deploy → Live at https://your-app.onrender.com" -ForegroundColor Green
Write-Host ""
Write-Host "Full guide: RENDER_DEPLOY.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️ Free tier: 750 hrs/mo, spins down after 15min inactivity" -ForegroundColor Yellow
Write-Host "⚠️ PostgreSQL/Redis expire after 90 days → Migrate to Neon/Upstash" -ForegroundColor Yellow