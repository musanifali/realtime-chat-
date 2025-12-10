# Deployment Guide

## Local Development

### Server
```bash
cd server
npm install
npm run dev
```
- Runs on port: `3001`
- Redis: `localhost:6379` (or `6381` for dev)

### Client
```bash
cd client
npm install
npm run dev
```
- Runs on port: `5173`
- Connects to: `http://localhost:3001`

## Production Deployment (13.49.78.104)

### 1. Build Client
```bash
cd client
npm install
npm run build
```

### 2. Deploy Client to Server
```bash
# Copy dist folder to server
scp -r dist/* user@13.49.78.104:/var/www/chat/
```

### 3. Deploy Server
```bash
cd server
npm install
npm run build

# On production server
export PORT=3001
export REDIS_URL=redis://localhost:6379
export NODE_ENV=production
npm start
```

### 4. Nginx Configuration
File: `/etc/nginx/sites-available/chat`
```nginx
server {
    listen 80;
    server_name 13.49.78.104;

    root /var/www/chat;
    index index.html;

    # React routes
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Socket.io proxy
    location /socket.io/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 5. Enable and Restart Nginx
```bash
sudo ln -s /etc/nginx/sites-available/chat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Start Server with PM2 (Process Manager)
```bash
npm install -g pm2
cd server
pm2 start npm --name "chat-server" -- start
pm2 save
pm2 startup
```

## Environment Variables

### Client (.env)
```env
VITE_SERVER_URL=http://13.49.78.104
```

### Server (.env)
```env
PORT=3001
REDIS_URL=redis://localhost:6379
NODE_ENV=production
```

## Troubleshooting

### 502 Bad Gateway
- Check if server is running: `pm2 status`
- Check server logs: `pm2 logs chat-server`
- Verify port 3001 is open: `netstat -tulpn | grep 3001`
- Check Redis: `redis-cli ping`

### Connection Issues
- Verify Nginx config: `sudo nginx -t`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Verify firewall: `sudo ufw status`

### Redis Issues
- Start Redis: `sudo systemctl start redis`
- Check status: `sudo systemctl status redis`
- Test connection: `redis-cli ping` (should return PONG)

## Monitoring

### Check Application Status
```bash
pm2 status
pm2 logs chat-server --lines 100
pm2 monit
```

### Nginx Status
```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Redis Status
```bash
sudo systemctl status redis
redis-cli info
redis-cli monitor
```
