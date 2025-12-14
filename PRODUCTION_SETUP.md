# Production Deployment Configuration

**Server:** AWS EC2 (13.49.78.104)  
**Domain:** bubu.servehttp.com  
**Date:** December 14, 2025

---

## 1. Server Setup

### Initial Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt update
sudo apt install -y mongodb-org
sudo systemctl enable mongod
sudo systemctl start mongod

# Install Redis
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install net-tools
sudo apt install -y net-tools
```

---

## 2. Backend Deployment

### Directory Structure

```
/home/ubuntu/realtime-chat-/
├── server/
│   ├── dist/          # Built TypeScript files
│   ├── src/           # Source code
│   ├── .env           # Environment variables
│   └── package.json
└── client/
    └── dist/          # Built React app
```

### Environment Variables (.env)

**Location:** `/home/ubuntu/realtime-chat-/server/.env`

```bash
# Server Configuration
PORT=3001
NODE_ENV=production
SERVER_ID=server-1

# Redis Configuration
REDIS_URL=redis://localhost:6379

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/realtime-chat

# JWT Secrets (Generated with openssl rand -base64 64)
JWT_SECRET=V2uOuMLinZB0BfsAhIGmRgcV2X95uiJOFI+KAjP0XVLX/TUI7yXqcMeqMkLFn127T3AlOjqIFhr3viD+VA9sNg==
JWT_REFRESH_SECRET=ty+5dqfpk2MLT0sXl2YSYtC3Z8xZOSognJ5a+BbXclktVjodMD2fTCeEkalxElwanPGc18MnQRLIeJ9HOcNAyQ==

# PubSub Channel
CHANNEL=chat-channel

# CORS Origin
CORS_ORIGIN=https://bubu.servehttp.com
```

### PM2 Configuration

```bash
# Navigate to server directory
cd /home/ubuntu/realtime-chat-/server

# Start server with PM2
pm2 start npm --name "chat-server" -- start

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Run the command it outputs (sudo env PATH=... pm2 startup systemd -u ubuntu --hp /home/ubuntu)
```

### PM2 Commands

```bash
# View running processes
pm2 list

# View logs
pm2 logs chat-server

# Restart server
pm2 restart chat-server

# Stop server
pm2 stop chat-server

# Delete process
pm2 delete chat-server

# Flush logs
pm2 flush
```

---

## 3. Frontend Deployment

### Build and Deploy

```bash
# Build React app locally
cd /path/to/local/realtime-chat/client
npm run build

# Copy to production server
scp -r dist/* ubuntu@13.49.78.104:/var/www/chat/

# Or on server directly
cd /home/ubuntu/realtime-chat-/client
npm run build
sudo cp -r dist/* /var/www/chat/
```

---

## 4. Nginx Configuration

### SSL Certificate Setup

```bash
# Obtain SSL certificate from Let's Encrypt
sudo certbot --nginx -d bubu.servehttp.com

# Certificate files location:
# /etc/letsencrypt/live/bubu.servehttp.com/fullchain.pem
# /etc/letsencrypt/live/bubu.servehttp.com/privkey.pem

# Fix certificate permissions
sudo chmod -R 755 /etc/letsencrypt/live/
sudo chmod -R 755 /etc/letsencrypt/archive/

# Test auto-renewal
sudo certbot renew --dry-run
```

### Nginx Configuration File

**Location:** `/etc/nginx/sites-available/default`

```nginx
# HTTP server - redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name bubu.servehttp.com;

    # Redirect all HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;

    server_name bubu.servehttp.com;

    # SSL certificate configuration
    ssl_certificate /etc/letsencrypt/live/bubu.servehttp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bubu.servehttp.com/privkey.pem;

    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    root /var/www/chat;
    index index.html;

    # API requests - proxy to Node.js backend
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS headers
        add_header 'Access-Control-Allow-Origin' '$http_origin' always;
        add_header 'Access-Control-Allow-Credentials' 'true' always;
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
        add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;

        if ($request_method = 'OPTIONS') {
            return 204;
        }
    }

    # Socket.IO requests - proxy to Node.js backend
    location /socket.io/ {
        proxy_pass http://localhost:3001/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Serve static files
    location / {
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

### Nginx Symlink Setup

```bash
# Remove old config symlink
sudo rm /etc/nginx/sites-enabled/chat

# Create symlink to default config
sudo ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## 5. AWS Security Group Configuration

### Required Inbound Rules

| Port | Protocol | Source    | Description               |
| ---- | -------- | --------- | ------------------------- |
| 22   | TCP      | 0.0.0.0/0 | SSH                       |
| 80   | TCP      | 0.0.0.0/0 | HTTP (redirects to HTTPS) |
| 443  | TCP      | 0.0.0.0/0 | HTTPS                     |

**Note:** Port 3001 (Node.js) should NOT be exposed - it's only accessible via Nginx reverse proxy.

---

## 6. Database Management

### MongoDB Commands

```bash
# Connect to MongoDB
mongosh

# Switch to chat database
use realtime-chat

# View collections
show collections

# Drop all data (clean database)
db.users.drop()
db.messages.drop()
db.friendships.drop()

# Or drop entire database
db.dropDatabase()

# Exit
exit
```

### Redis Commands

```bash
# Connect to Redis
redis-cli

# Clear all data
FLUSHALL

# View all keys
KEYS *

# Exit
exit
```

### Quick Database Reset

```bash
# One-liner to reset everything
mongosh --eval "use realtime-chat; db.dropDatabase();" && redis-cli FLUSHALL && pm2 restart chat-server
```

---

## 7. Troubleshooting Commands

### Check Service Status

```bash
# Check all services
sudo systemctl status mongod
sudo systemctl status redis-server
sudo systemctl status nginx
pm2 status

# Check logs
pm2 logs chat-server --lines 50
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Network & Ports

```bash
# Check listening ports
sudo ss -tlnp | grep -E ':80|:443|:3001'
sudo netstat -tlnp | grep -E ':80|:443|:3001'

# Test connections
curl http://localhost:80
curl -k https://localhost:443
curl http://localhost:3001/health
```

### Restart Everything

```bash
# Restart all services
sudo systemctl restart mongod
sudo systemctl restart redis-server
sudo systemctl restart nginx
pm2 restart chat-server
```

---

## 8. Client-Side Changes

### Authorization Header Fix

**File:** `client/src/services/authService.ts`

Added axios interceptor to include JWT token in requests:

```typescript
// Add request interceptor to include Authorization header
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
```

### Cookie Settings (Server)

**File:** `server/src/controllers/AuthController.ts`

Changed cookie settings for production:

```typescript
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Set to true only if using HTTPS with proper domain
  sameSite: "lax" as const, // 'lax' works better for same-site requests through proxy
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};
```

---

## 9. Production Architecture

```
Internet (HTTPS)
    ↓
bubu.servehttp.com (DNS → 13.49.78.104)
    ↓
AWS Security Group (Firewall)
    ↓ Port 443
Nginx (Reverse Proxy)
    ├── /api/* → http://localhost:3001/api/
    ├── /socket.io/* → http://localhost:3001/socket.io/
    └── /* → /var/www/chat/ (React App)
    ↓
Node.js Server (PM2) - Port 3001
    ├── MongoDB (localhost:27017)
    └── Redis (localhost:6379)
```

---

## 10. Deployment Checklist

### Initial Setup

- [x] Install MongoDB, Redis, Node.js, PM2, Nginx
- [x] Clone repository to server
- [x] Build backend (`npm run build` in server/)
- [x] Build frontend (`npm run build` in client/)
- [x] Create `.env` file with production values
- [x] Configure Nginx reverse proxy
- [x] Obtain SSL certificate with Certbot
- [x] Configure AWS Security Group (ports 22, 80, 443)
- [x] Start PM2 process
- [x] Configure PM2 startup script

### After Code Changes

1. Build locally: `npm run build` (server or client)
2. Upload to server: `scp -r dist/* ubuntu@13.49.78.104:/path/`
3. Restart services: `pm2 restart chat-server` or `sudo systemctl restart nginx`
4. Check logs: `pm2 logs chat-server`
5. Test: Visit https://bubu.servehttp.com

---

## 11. Important URLs

- **Production Site:** https://bubu.servehttp.com
- **HTTP (redirects):** http://bubu.servehttp.com
- **Server IP:** http://13.49.78.104 (also redirects to HTTPS)
- **Health Check:** https://bubu.servehttp.com/api/health (via Nginx proxy)

---

## 12. Maintenance

### SSL Certificate Renewal

Certificates auto-renew via certbot. Manual renewal:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Update Application

```bash
# On local machine, build new version
npm run build

# Upload to server
scp -r dist/* ubuntu@13.49.78.104:/home/ubuntu/realtime-chat-/server/dist/

# Restart PM2
ssh ubuntu@13.49.78.104
pm2 restart chat-server
```

### Monitor Resources

```bash
# Check disk usage
df -h

# Check memory
free -h

# Check CPU and processes
htop

# Check PM2 monitoring
pm2 monit
```

---

## 13. Security Notes

1. **JWT Secrets:** Strong 64-character base64 secrets generated with `openssl`
2. **MongoDB:** Running without authentication (consider enabling for production)
3. **Redis:** Running without password (consider enabling AUTH)
4. **Firewall:** Only ports 22, 80, 443 exposed via AWS Security Group
5. **SSL/TLS:** Let's Encrypt certificate with TLS 1.2/1.3
6. **Nginx Headers:** Security headers enabled (X-Frame-Options, CSP, etc.)

### Recommended Security Improvements

```bash
# Enable MongoDB authentication
mongosh
use admin
db.createUser({
  user: "chatadmin",
  pwd: "strong-password",
  roles: ["readWriteAnyDatabase"]
})

# Update MONGODB_URI in .env
MONGODB_URI=mongodb://chatadmin:strong-password@localhost:27017/realtime-chat

# Enable Redis password
sudo nano /etc/redis/redis.conf
# Add: requirepass your-strong-password
sudo systemctl restart redis-server

# Update REDIS_URL in .env
REDIS_URL=redis://:your-strong-password@localhost:6379
```

---

**Last Updated:** December 14, 2025  
**Status:** ✅ Production Ready
