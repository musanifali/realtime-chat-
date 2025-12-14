# Deploy to production server
# Usage: .\deploy-new.ps1

$SERVER_USER = "ubuntu"
$SERVER_IP = "13.49.78.104"
$REMOTE_PATH = "/home/ubuntu/realtime-chat"

Write-Host "Deploying to production server..." -ForegroundColor Green

# Build client
Write-Host "Building client..." -ForegroundColor Cyan
Set-Location client
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Client build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Build server
Write-Host "Building server..." -ForegroundColor Cyan
Set-Location server
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Server build failed!" -ForegroundColor Red
    exit 1
}
Set-Location ..

Write-Host "Uploading files to server..." -ForegroundColor Cyan

# Create tarball to upload
Write-Host "Creating deployment archive..." -ForegroundColor Yellow
tar -czf deploy.tar.gz server/dist server/package.json server/package-lock.json client/dist

# Upload to server
Write-Host "Uploading to $SERVER_IP..." -ForegroundColor Yellow
scp deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/

# Extract and restart on server
Write-Host "Deploying on server..." -ForegroundColor Cyan
$remoteCommands = @"
cd $REMOTE_PATH
tar -xzf deploy.tar.gz
rm deploy.tar.gz
sudo rm -rf /var/www/chat/*
sudo cp -r client/dist/* /var/www/chat/
pm2 restart realtime-chat
pm2 save
echo 'Deployment complete!'
"@

ssh ${SERVER_USER}@${SERVER_IP} $remoteCommands

# Cleanup local tarball
Remove-Item deploy.tar.gz

Write-Host ""
Write-Host "Deployment successful!" -ForegroundColor Green
Write-Host "Application available at: https://bubu.servehttp.com" -ForegroundColor Cyan
