<# 
.SYNOPSIS
    Deploy muchhad-quiz to Northflank (free tier)
.DESCRIPTION
    Helps push to GitHub and provides Northflank setup instructions
#>

param(
    [string]$GitHubUsername = "",
    [string]$RepoName = "Live-quiz"
)

Write-Host "=== muchhad-quiz Northflank Deployment Helper ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path ".git")) {
    Write-Host "Initializing Git repository..." -ForegroundColor Yellow
    git init
    git add .
    git commit -m "muchhad-quiz ready for Northflank"
    git branch -M main
} else {
    Write-Host "Git repository already initialized" -ForegroundColor Green
}

# Get GitHub username if not provided
if (-not $GitHubUsername) {
    $GitHubUsername = Read-Host "Enter your GitHub username"
}

$repoUrl = "https://github.com/$GitHubUsername/$RepoName.git"

Write-Host ""
Write-Host "Repository URL: $repoUrl" -ForegroundColor Cyan
Write-Host ""

# Check if remote exists
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "Adding GitHub remote..." -ForegroundColor Yellow
    git remote add origin $repoUrl
} elseif ($remote -ne $repoUrl) {
    Write-Host "Updating remote URL..." -ForegroundColor Yellow
    git remote set-url origin $repoUrl
}

# Commit any changes
Write-Host "Committing latest changes..." -ForegroundColor Yellow
git add .
$commitMsg = "Deploy to Northflank - $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git commit -m $commitMsg 2>$null

# Push to GitHub
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
try {
    git push -u origin main
    Write-Host "✅ Pushed to GitHub successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Push failed. You may need to:" -ForegroundColor Red
    Write-Host "  1. Create repo at: https://github.com/new" -ForegroundColor Yellow
    Write-Host "  2. Name it: $RepoName" -ForegroundColor Yellow
    Write-Host "  3. Don't initialize with README" -ForegroundColor Yellow
    Write-Host "  4. Run this script again" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Next Steps (Manual in Browser) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Go to: https://app.northflank.com" -ForegroundColor White
Write-Host "2. Sign up (free, no credit card)" -ForegroundColor White
Write-Host "3. Click 'New Project' → Select GitHub → Choose '$RepoName'" -ForegroundColor White
Write-Host "4. Add PostgreSQL addon (Free plan)" -ForegroundColor White
Write-Host "5. Add Redis addon (Free plan)" -ForegroundColor White
Write-Host "6. Copy connection URIs from addons" -ForegroundColor White
Write-Host "7. Set Secrets in Service 'app':" -ForegroundColor White
Write-Host "   - jwt-secret: (run 'openssl rand -hex 32' to generate)" -ForegroundColor White
Write-Host "   - database-url: (from PostgreSQL addon)" -ForegroundColor White
Write-Host "   - redis-url: (from Redis addon)" -ForegroundColor White
Write-Host "   - public-host: (your-app-name.northflank.app after deploy)" -ForegroundColor White
Write-Host "8. Click Deploy" -ForegroundColor White
Write-Host ""
Write-Host "Full guide: NORTHFLANK_DEPLOY.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your app will be at: https://your-app-name.northflank.app" -ForegroundColor Green