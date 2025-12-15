# Quick Deploy to Free Platforms - PowerShell Script
# Run this script to prepare your project for free deployment

Write-Host "🚀 BubuChat - Free Deployment Setup" -ForegroundColor Cyan
Write-Host "====================================`n" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "server")) {
    Write-Host "❌ Error: Run this script from the project root directory!" -ForegroundColor Red
    Write-Host "   Expected: c:\Users\HP\Desktop\realtime-chat" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Project directory verified`n" -ForegroundColor Green

# Step 1: Check Git
Write-Host "📦 Step 1: Checking Git..." -ForegroundColor Yellow
if (-not (Test-Path ".git")) {
    Write-Host "   Initializing Git repository..." -ForegroundColor Gray
    git init
    Write-Host "   ✅ Git initialized" -ForegroundColor Green
}
else {
    Write-Host "   ✅ Git already initialized" -ForegroundColor Green
}

# Step 2: Create deployment files
Write-Host "`n📝 Step 2: Creating deployment configuration files..." -ForegroundColor Yellow

# Check if files exist
$filesCreated = 0

if (Test-Path "render.yaml") {
    Write-Host "   ✅ render.yaml already exists" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  render.yaml not found - please create it manually" -ForegroundColor Yellow
}

if (Test-Path "client\.env.production") {
    Write-Host "   ✅ client/.env.production already exists" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  client/.env.production not found - please create it manually" -ForegroundColor Yellow
}

if (Test-Path "client\vercel.json") {
    Write-Host "   ✅ client/vercel.json already exists" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  client/vercel.json not found - please create it manually" -ForegroundColor Yellow
}

# Step 3: Generate secrets
Write-Host "`n🔐 Step 3: Generating JWT Secrets..." -ForegroundColor Yellow
Write-Host "   JWT_SECRET:" -ForegroundColor Gray
$jwtSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
Write-Host "   $jwtSecret" -ForegroundColor Cyan

Write-Host "`n   JWT_REFRESH_SECRET:" -ForegroundColor Gray
$jwtRefreshSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object { [char]$_ })
Write-Host "   $jwtRefreshSecret" -ForegroundColor Cyan

Write-Host "`n   💾 Save these secrets - you'll need them for Render!" -ForegroundColor Yellow

# Step 4: Check VAPID keys
Write-Host "`n🔑 Step 4: Checking VAPID keys..." -ForegroundColor Yellow
if (Test-Path "server\.env") {
    $envContent = Get-Content "server\.env" -Raw
    if ($envContent -match "VAPID_PUBLIC_KEY") {
        Write-Host "   ✅ VAPID keys found in server/.env" -ForegroundColor Green
        Write-Host "   📝 Copy these keys to Render environment variables" -ForegroundColor Yellow
    }
    else {
        Write-Host "   ⚠️  VAPID keys not found in server/.env" -ForegroundColor Yellow
        Write-Host "   Generate them with: cd server; npx web-push generate-vapid-keys" -ForegroundColor Gray
    }
}
else {
    Write-Host "   ⚠️  server/.env not found" -ForegroundColor Yellow
    Write-Host "   Generate VAPID keys with: cd server; npx web-push generate-vapid-keys" -ForegroundColor Gray
}

# Step 5: Check package.json scripts
Write-Host "`n📦 Step 5: Verifying server package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "server\package.json" | ConvertFrom-Json
if ($packageJson.scripts.build -and $packageJson.scripts.start) {
    Write-Host "   ✅ Build and start scripts configured" -ForegroundColor Green
}
else {
    Write-Host "   ⚠️  Missing scripts in server/package.json" -ForegroundColor Yellow
    Write-Host "   Add these to scripts section:" -ForegroundColor Gray
    Write-Host '   "build": "tsc"' -ForegroundColor Gray
    Write-Host '   "start": "node dist/index.js"' -ForegroundColor Gray
}

# Step 6: Git status
Write-Host "`n📊 Step 6: Checking Git status..." -ForegroundColor Yellow
$gitStatus = git status --short
if ($gitStatus) {
    Write-Host "   📝 Uncommitted changes found:" -ForegroundColor Yellow
    Write-Host $gitStatus -ForegroundColor Gray
    Write-Host "`n   Run these commands to commit:" -ForegroundColor Yellow
    Write-Host "   git add ." -ForegroundColor Cyan
    Write-Host "   git commit -m 'Prepare for free platform deployment'" -ForegroundColor Cyan
}
else {
    Write-Host "   ✅ No uncommitted changes" -ForegroundColor Green
}

# Step 7: Summary
Write-Host "`n" -NoNewline
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "📋 DEPLOYMENT CHECKLIST" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

Write-Host "`n✅ COMPLETED:" -ForegroundColor Green
Write-Host "   • Git repository initialized" -ForegroundColor Gray
Write-Host "   • JWT secrets generated" -ForegroundColor Gray

Write-Host "`n📝 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "`n   1. Create accounts on:" -ForegroundColor White
Write-Host "      • MongoDB Atlas: https://www.mongodb.com/cloud/atlas/register" -ForegroundColor Gray
Write-Host "      • Upstash Redis: https://upstash.com/" -ForegroundColor Gray
Write-Host "      • Render: https://render.com/" -ForegroundColor Gray
Write-Host "      • Vercel: https://vercel.com/" -ForegroundColor Gray

Write-Host "`n   2. Setup services:" -ForegroundColor White
Write-Host "      • Create MongoDB Atlas cluster (M0 Free)" -ForegroundColor Gray
Write-Host "      • Create Upstash Redis database (Free)" -ForegroundColor Gray
Write-Host "      • Get connection strings" -ForegroundColor Gray

Write-Host "`n   3. Push to GitHub:" -ForegroundColor White
Write-Host "      git add ." -ForegroundColor Cyan
Write-Host "      git commit -m 'Ready for deployment'" -ForegroundColor Cyan
Write-Host "      git remote add origin https://github.com/YOUR_USERNAME/bubuchat.git" -ForegroundColor Cyan
Write-Host "      git push -u origin main" -ForegroundColor Cyan

Write-Host "`n   4. Deploy backend to Render:" -ForegroundColor White
Write-Host "      • Go to Render Dashboard" -ForegroundColor Gray
Write-Host "      • New Web Service → Connect GitHub" -ForegroundColor Gray
Write-Host "      • Add environment variables (see below)" -ForegroundColor Gray

Write-Host "`n   5. Deploy frontend to Vercel:" -ForegroundColor White
Write-Host "      • Go to Vercel Dashboard" -ForegroundColor Gray
Write-Host "      • New Project → Import from GitHub" -ForegroundColor Gray
Write-Host "      • Set root directory to 'client'" -ForegroundColor Gray

Write-Host "`n🔐 ENVIRONMENT VARIABLES FOR RENDER:" -ForegroundColor Cyan
Write-Host "   Copy these when deploying to Render:" -ForegroundColor Gray
Write-Host "`n   NODE_ENV=production"
Write-Host "   PORT=10000"
Write-Host "   MONGODB_URI=<your MongoDB Atlas connection string>"
Write-Host "   REDIS_URL=<your Upstash Redis URL>"
Write-Host "   JWT_SECRET=$jwtSecret" -ForegroundColor Yellow
Write-Host "   JWT_REFRESH_SECRET=$jwtRefreshSecret" -ForegroundColor Yellow
Write-Host "   VAPID_PUBLIC_KEY=<from server/.env or generate>"
Write-Host "   VAPID_PRIVATE_KEY=<from server/.env or generate>"
Write-Host "   VAPID_SUBJECT=mailto:admin@bubuchat.com"
Write-Host "   CORS_ORIGIN=https://bubuchat.vercel.app"

Write-Host "`n📖 DETAILED GUIDE:" -ForegroundColor Cyan
Write-Host "   See FREE_DEPLOYMENT_GUIDE.md for complete instructions" -ForegroundColor Gray
Write-Host "   See DEPLOYMENT_CHECKLIST.md for step-by-step checklist" -ForegroundColor Gray

Write-Host "`n✨ Good luck with your deployment!" -ForegroundColor Green
Write-Host "   You'll save ~$120/year by using free platforms! 💰" -ForegroundColor Green
Write-Host "`n=====================================" -ForegroundColor Cyan
