# Production Deployment Guide

## Prerequisites on Production Server (13.49.78.104)

1. **MongoDB Installation**
   ```bash
   # Install MongoDB
   sudo apt update
   sudo apt install -y mongodb-org
   
   # Start MongoDB service
   sudo systemctl start mongod
   sudo systemctl enable mongod
   
   # Verify MongoDB is running
   sudo systemctl status mongod
   ```

2. **Redis Installation**
   ```bash
   # Install Redis
   sudo apt install -y redis-server
   
   # Start Redis service
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   
   # Verify Redis is running
   redis-cli ping  # Should respond with PONG
   ```

3. **Node.js & PM2**
   ```bash
   # Install Node.js (if not already installed)
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install PM2 globally
   sudo npm install -g pm2
   ```

## Production Configuration

### 1. Server Environment Variables

Create `/var/www/chat-server/.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=production
SERVER_ID=server-1

# Redis Configuration (local)
REDIS_URL=redis://localhost:6379

# MongoDB Configuration (local)
MONGODB_URI=mongodb://localhost:27017/realtime-chat

# JWT Secrets (CHANGE THESE!)
JWT_SECRET=your-production-secret-key-here-use-long-random-string
JWT_REFRESH_SECRET=your-production-refresh-secret-here-use-long-random-string

# PubSub Channel
CHANNEL=chat-channel

# CORS Origin
CORS_ORIGIN=http://13.49.78.104
```

**🔒 Security Note**: Generate strong random secrets:
```bash
# Generate secure JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. MongoDB Security (Production)

```bash
# Connect to MongoDB
mongosh

# Switch to admin database
use admin

# Create admin user
db.createUser({
  user: "admin",
  pwd: "your-strong-password",
  roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
})

# Create app user for realtime-chat database
use realtime-chat
db.createUser({
  user: "chatapp",
  pwd: "your-app-password",
  roles: [{ role: "readWrite", db: "realtime-chat" }]
})

# Exit mongosh
exit
```

Update MongoDB URI in `.env`:
```env
MONGODB_URI=mongodb://chatapp:your-app-password@localhost:27017/realtime-chat
```

Enable MongoDB authentication:
```bash
# Edit MongoDB config
sudo nano /etc/mongod.conf

# Add these lines:
security:
  authorization: enabled

# Restart MongoDB
sudo systemctl restart mongod
```

### 3. Redis Security (Production)

```bash
# Edit Redis config
sudo nano /etc/redis/redis.conf

# Set a password (uncomment and change)
requirepass your-strong-redis-password

# Bind to localhost only (should already be set)
bind 127.0.0.1 ::1

# Restart Redis
sudo systemctl restart redis-server
```

Update Redis URL in `.env`:
```env
REDIS_URL=redis://:your-strong-redis-password@localhost:6379
```

### 4. Deploy Backend

```bash
# Navigate to server directory
cd /var/www/chat-server

# Install dependencies
npm install --production

# Build TypeScript (if needed)
npm run build

# Start with PM2
pm2 start src/index.ts --name chat-server --interpreter tsx

# Or if you have a build script:
# pm2 start dist/index.js --name chat-server

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# View logs
pm2 logs chat-server

# Monitor
pm2 monit
```

### 5. Deploy Frontend

```bash
# On your local machine, build the React app
cd client
npm run build

# The build folder will be created with optimized production files
# Transfer to server
scp -r dist/* root@13.49.78.104:/var/www/chat/

# Or use rsync
rsync -avz dist/ root@13.49.78.104:/var/www/chat/
```

### 6. Nginx Configuration

The nginx config file at `/etc/nginx/sites-available/chat` should already be configured.

Verify and reload:
```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 7. Firewall Configuration

```bash
# Allow necessary ports
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS (for future SSL)
sudo ufw allow 22/tcp    # SSH

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Database Architecture

```
┌─────────────────────────────────────────────────┐
│              Client Browser                      │
│         (http://13.49.78.104)                   │
└────────────────┬────────────────────────────────┘
                 │ HTTP/WebSocket
                 ▼
┌─────────────────────────────────────────────────┐
│           Nginx (Port 80)                        │
│   - /api/* → Node.js (3001)                     │
│   - /socket.io/* → Node.js (3001)               │
│   - /* → React static files                      │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│        Node.js Server (Port 3001)                │
│   - Express API                                  │
│   - Socket.IO                                    │
│   - JWT Authentication                           │
└────┬────────────────────────┬────────────────────┘
     │                        │
     ▼                        ▼
┌─────────────┐        ┌─────────────┐
│  MongoDB    │        │   Redis     │
│ (Port 27017)│        │ (Port 6379) │
│             │        │             │
│ - Users     │        │ - PubSub    │
│ - Messages  │        │ - Sessions  │
└─────────────┘        └─────────────┘
```

**Important Notes:**
- MongoDB and Redis run **locally** on the same server as Node.js
- They are **NOT** exposed to the internet (bind to 127.0.0.1)
- Only Node.js connects to them via localhost
- Nginx only proxies HTTP/WebSocket to Node.js
- Client browsers never connect directly to databases

## Verification

### 1. Check Services
```bash
# MongoDB
sudo systemctl status mongod

# Redis
sudo systemctl status redis-server

# PM2 processes
pm2 list

# Nginx
sudo systemctl status nginx
```

### 2. Test MongoDB Connection
```bash
mongosh "mongodb://chatapp:your-app-password@localhost:27017/realtime-chat"
```

### 3. Test Redis Connection
```bash
redis-cli -a your-strong-redis-password ping
```

### 4. Test API Endpoints
```bash
# Health check
curl http://localhost:3001/health

# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"password123","displayName":"Test User"}'

# From external
curl http://13.49.78.104/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser2","email":"test2@example.com","password":"password123","displayName":"Test User 2"}'
```

### 5. Test WebSocket
```bash
# Check Socket.IO is responding
curl http://localhost:3001/socket.io/?EIO=4&transport=polling
```

## Monitoring

```bash
# View application logs
pm2 logs chat-server

# View last 100 lines
pm2 logs chat-server --lines 100

# Monitor resources
pm2 monit

# View MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# View Redis logs
sudo tail -f /var/log/redis/redis-server.log

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

## Troubleshooting

### MongoDB Connection Issues
```bash
# Check if MongoDB is running
sudo systemctl status mongod

# Check MongoDB logs
sudo tail -f /var/log/mongodb/mongod.log

# Test connection
mongosh "mongodb://localhost:27017"
```

### Redis Connection Issues
```bash
# Check if Redis is running
sudo systemctl status redis-server

# Test connection
redis-cli ping

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### PM2 Issues
```bash
# Restart application
pm2 restart chat-server

# View logs with errors
pm2 logs chat-server --err

# Delete and restart
pm2 delete chat-server
pm2 start src/index.ts --name chat-server --interpreter tsx
```

### Port Already in Use
```bash
# Find process using port 3001
sudo lsof -i :3001

# Kill the process
sudo kill -9 <PID>

# Or use PM2
pm2 delete chat-server
pm2 start src/index.ts --name chat-server --interpreter tsx
```

## Backup Strategy

### MongoDB Backup
```bash
# Create backup directory
sudo mkdir -p /var/backups/mongodb

# Backup script
mongodump --uri="mongodb://chatapp:your-app-password@localhost:27017/realtime-chat" \
  --out=/var/backups/mongodb/$(date +%Y%m%d)

# Restore from backup
mongorestore --uri="mongodb://chatapp:your-app-password@localhost:27017/realtime-chat" \
  /var/backups/mongodb/20241213/realtime-chat
```

### Automated Backups
```bash
# Create backup script
sudo nano /usr/local/bin/backup-mongodb.sh

#!/bin/bash
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
mongodump --uri="mongodb://chatapp:password@localhost:27017/realtime-chat" \
  --out="$BACKUP_DIR/$DATE"
# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;

# Make executable
sudo chmod +x /usr/local/bin/backup-mongodb.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-mongodb.sh
```

## SSL/HTTPS Setup (Recommended)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (requires domain name)
sudo certbot --nginx -d yourdomain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

## Performance Optimization

### PM2 Cluster Mode
```bash
# Run multiple instances
pm2 start src/index.ts --name chat-server --interpreter tsx -i max

# Or specific number
pm2 start src/index.ts --name chat-server --interpreter tsx -i 4
```

### MongoDB Indexes
```bash
mongosh "mongodb://chatapp:password@localhost:27017/realtime-chat"

# Verify indexes are created
db.users.getIndexes()

# Should show indexes on username and email
```

## Summary Checklist

- [ ] MongoDB installed and secured with authentication
- [ ] Redis installed and secured with password
- [ ] Node.js and PM2 installed
- [ ] Backend `.env` file configured with strong secrets
- [ ] Backend running via PM2
- [ ] Frontend built and deployed to `/var/www/chat`
- [ ] Nginx configured and running
- [ ] Firewall configured
- [ ] Services tested and verified
- [ ] Backup strategy implemented
- [ ] Monitoring set up
