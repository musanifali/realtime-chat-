# Free Deployment Guide - AWS to Free Platforms Migration

## 🎯 Migration Overview

Migrate from AWS EC2 (paid) to completely **FREE** platforms while maintaining all features:

| Component           | Current (AWS)  | Free Replacement | Cost Savings     |
| ------------------- | -------------- | ---------------- | ---------------- |
| **Backend**         | EC2 ($5-10/mo) | Render Free      | **$5-10/mo**     |
| **Database**        | MongoDB Local  | MongoDB Atlas M0 | **Free**         |
| **Cache**           | Redis Local    | Upstash Redis    | **Free**         |
| **Frontend**        | EC2 + Nginx    | Vercel/Netlify   | **Free**         |
| **SSL**             | Manual         | Automatic        | **Free**         |
| **Process Manager** | PM2            | Built-in         | **Free**         |
| **Total Savings**   | -              | -                | **$60-120/year** |

---

## 📋 Prerequisites

- GitHub account (for code hosting)
- Accounts on:
  - Render.com
  - MongoDB Atlas
  - Upstash.com
  - Vercel.com (or Netlify.com)

---

## 🚀 Step-by-Step Migration

### **Phase 1: Setup Free Services** (30 minutes)

#### 1.1 MongoDB Atlas (Free Database)

**Create Free Cluster:**

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Sign up / Log in
3. Click **"Build a Database"**
4. Select **"M0 Shared (FREE)"**
   - Region: Choose closest to you
   - Cluster name: `bubuchat-cluster`
5. Click **"Create"**

**Configure Database Access:**

1. Click **"Database Access"** (left sidebar)
2. Click **"Add New Database User"**
   - Username: `bubuchat-admin`
   - Password: Generate strong password (save it!)
   - Role: `Read and write to any database`
3. Click **"Add User"**

**Configure Network Access:**

1. Click **"Network Access"** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access From Anywhere"** (0.0.0.0/0)
   - Note: For production, restrict to Render IPs later
4. Click **"Confirm"**

**Get Connection String:**

1. Click **"Database"** → **"Connect"**
2. Select **"Connect your application"**
3. Copy connection string:
   ```
   mongodb+srv://bubuchat-admin:<password>@bubuchat-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<password>` with your actual password
5. Add database name: `/realtime-chat` before `?`
   ```
   mongodb+srv://bubuchat-admin:YOUR_PASSWORD@bubuchat-cluster.xxxxx.mongodb.net/realtime-chat?retryWrites=true&w=majority
   ```

---

#### 1.2 Upstash Redis (Free Cache)

**Create Free Redis:**

1. Go to [Upstash](https://upstash.com/)
2. Sign up / Log in
3. Click **"Create Database"**
   - Name: `bubuchat-redis`
   - Type: **Global** (free, distributed)
   - Region: Choose closest
4. Click **"Create"**

**Get Redis URL:**

1. Click on your database
2. Copy **"REST URL"** or **"Redis URL"**:
   ```
   redis://default:YOUR_PASSWORD@us1-tops-shark-12345.upstash.io:6379
   ```
3. Save this URL

**Alternative: Use Redis REST API** (recommended for serverless):

```
UPSTASH_REDIS_REST_URL=https://us1-tops-shark-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN
```

---

#### 1.3 Push to GitHub (Code Repository)

**Initialize Git (if not already):**

```bash
cd c:\Users\HP\Desktop\realtime-chat

# Initialize git
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - ready for free deployment"
```

**Create GitHub Repository:**

1. Go to [GitHub](https://github.com/new)
2. Create new repository:
   - Name: `bubuchat`
   - Visibility: Private (or Public)
   - Don't initialize with README
3. Click **"Create repository"**

**Push Code:**

```bash
# Add remote
git remote add origin https://github.com/YOUR_USERNAME/bubuchat.git

# Push
git branch -M main
git push -u origin main
```

---

### **Phase 2: Deploy Backend to Render** (20 minutes)

#### 2.1 Prepare Backend for Render

**Create `render.yaml` in project root:**

```bash
# In c:\Users\HP\Desktop\realtime-chat\
New-Item -Path "render.yaml" -ItemType File
```

**Edit `render.yaml`:**

```yaml
services:
  - type: web
    name: bubuchat-backend
    env: node
    region: oregon # or closest to you
    plan: free
    buildCommand: cd server && npm install && npm run build
    startCommand: cd server && npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3001
      - key: MONGODB_URI
        sync: false # Will set manually
      - key: REDIS_URL
        sync: false # Will set manually
      - key: JWT_SECRET
        generateValue: true
      - key: JWT_REFRESH_SECRET
        generateValue: true
      - key: VAPID_PUBLIC_KEY
        sync: false
      - key: VAPID_PRIVATE_KEY
        sync: false
      - key: VAPID_SUBJECT
        value: mailto:admin@bubuchat.com
      - key: CORS_ORIGIN
        value: https://bubuchat.vercel.app # Will update after frontend deploy
```

**Update `server/package.json` - Add start script:**

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

**Commit Changes:**

```bash
git add render.yaml server/package.json
git commit -m "Add Render deployment config"
git push
```

#### 2.2 Deploy on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Sign up / Log in with GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect your GitHub repository: `bubuchat`
5. Configure:

   - **Name:** `bubuchat-backend`
   - **Region:** Oregon (or closest)
   - **Branch:** `main`
   - **Root Directory:** Leave empty
   - **Environment:** `Node`
   - **Build Command:** `cd server && npm install && npm run build`
   - **Start Command:** `cd server && npm start`
   - **Plan:** **Free**

6. Click **"Advanced"** → Add Environment Variables:

   ```
   NODE_ENV=production
   PORT=3001
   MONGODB_URI=mongodb+srv://bubuchat-admin:PASSWORD@cluster.mongodb.net/realtime-chat
   REDIS_URL=redis://default:PASSWORD@upstash-url:6379
   JWT_SECRET=<generate 64 char random string>
   JWT_REFRESH_SECRET=<generate 64 char random string>
   VAPID_PUBLIC_KEY=<your VAPID public key>
   VAPID_PRIVATE_KEY=<your VAPID private key>
   VAPID_SUBJECT=mailto:admin@bubuchat.com
   CORS_ORIGIN=https://bubuchat.vercel.app
   ```

7. Click **"Create Web Service"**

**Wait for Deployment** (5-10 minutes):

- Render will build and deploy automatically
- You'll get a URL like: `https://bubuchat-backend.onrender.com`

**Test Backend:**

```bash
curl https://bubuchat-backend.onrender.com/health
# Should return: {"status":"ok","server":"server-1"}
```

---

### **Phase 3: Deploy Frontend to Vercel** (15 minutes)

#### 3.1 Prepare Frontend

**Update `client/.env.production`:**

```env
VITE_API_URL=https://bubuchat-backend.onrender.com
VITE_SOCKET_URL=https://bubuchat-backend.onrender.com
```

**Update `client/src/config/constants.ts`:**

```typescript
export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? "https://bubuchat-backend.onrender.com"
    : "http://localhost:3001");

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (import.meta.env.PROD
    ? "https://bubuchat-backend.onrender.com"
    : "http://localhost:3001");
```

**Commit Changes:**

```bash
git add client/.env.production client/src/config/constants.ts
git commit -m "Update API URLs for Vercel deployment"
git push
```

#### 3.2 Deploy on Vercel

**Option A: Via Vercel CLI (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client folder
cd client

# Login to Vercel
vercel login

# Deploy
vercel --prod

# Follow prompts:
# - Set up and deploy? Yes
# - Scope: Your account
# - Link to existing project? No
# - Project name: bubuchat
# - Directory: ./ (current)
# - Override settings? No
```

**Option B: Via Vercel Dashboard**

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"Add New..."** → **"Project"**
3. Import your GitHub repository: `bubuchat`
4. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `client`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. Add Environment Variables:
   ```
   VITE_API_URL=https://bubuchat-backend.onrender.com
   VITE_SOCKET_URL=https://bubuchat-backend.onrender.com
   ```
6. Click **"Deploy"**

**Your Frontend URL:**

- You'll get: `https://bubuchat.vercel.app`
- Or custom domain if you set one up

---

### **Phase 4: Update CORS on Backend** (5 minutes)

Now that frontend is deployed, update backend CORS:

**On Render Dashboard:**

1. Go to your backend service: `bubuchat-backend`
2. Click **"Environment"** tab
3. Edit **`CORS_ORIGIN`**:
   ```
   CORS_ORIGIN=https://bubuchat.vercel.app
   ```
4. Click **"Save Changes"**
5. Service will auto-redeploy

**Or if you have multiple frontends:**

```
CORS_ORIGIN=https://bubuchat.vercel.app,http://localhost:5173
```

---

### **Phase 5: Migrate Data from AWS** (Optional - 15 minutes)

If you have existing data on AWS MongoDB:

#### 5.1 Export from AWS MongoDB

```bash
# SSH into AWS EC2
ssh root@13.49.78.104

# Export data
mongodump --uri="mongodb://localhost:27017/realtime-chat" --out=/tmp/mongodb-backup

# Compress
cd /tmp
tar -czf mongodb-backup.tar.gz mongodb-backup

# Download to local machine
# On your local Windows machine:
scp root@13.49.78.104:/tmp/mongodb-backup.tar.gz C:\Users\HP\Desktop\
```

#### 5.2 Import to MongoDB Atlas

```bash
# Extract backup
tar -xzf mongodb-backup.tar.gz

# Import to Atlas
mongorestore --uri="mongodb+srv://bubuchat-admin:PASSWORD@cluster.mongodb.net/realtime-chat" mongodb-backup/realtime-chat
```

---

## 🎨 Architecture After Migration

```
┌─────────────────────────────────────────────────────┐
│          Users (Browser / PWA)                      │
│          https://bubuchat.vercel.app                │
└────────────────┬────────────────────────────────────┘
                 │ HTTPS (Auto SSL)
                 ▼
┌─────────────────────────────────────────────────────┐
│          Vercel CDN (Frontend)                      │
│          - React SPA                                │
│          - Service Worker                           │
│          - PWA Assets                               │
└────────────────┬────────────────────────────────────┘
                 │ API Calls / WebSocket
                 ▼
┌─────────────────────────────────────────────────────┐
│     Render (Backend - Free Tier)                    │
│     https://bubuchat-backend.onrender.com          │
│     - Node.js + Express                             │
│     - Socket.IO                                     │
│     - JWT Auth                                      │
│     - Push Notifications                            │
└────┬──────────────────────────┬─────────────────────┘
     │                          │
     ▼                          ▼
┌────────────────┐      ┌──────────────────┐
│ MongoDB Atlas  │      │  Upstash Redis   │
│   (Free M0)    │      │    (Free)        │
│                │      │                  │
│ - 512MB Storage│      │ - 10K commands/day│
│ - Shared CPU   │      │ - Global CDN     │
└────────────────┘      └──────────────────┘
```

---

## ⚙️ Configuration Summary

### Environment Variables

**Backend (Render):**

```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://bubuchat-admin:PASSWORD@cluster.mongodb.net/realtime-chat
REDIS_URL=redis://default:PASSWORD@upstash.io:6379
JWT_SECRET=<64-char-random-string>
JWT_REFRESH_SECRET=<64-char-random-string>
VAPID_PUBLIC_KEY=<your-vapid-public-key>
VAPID_PRIVATE_KEY=<your-vapid-private-key>
VAPID_SUBJECT=mailto:admin@bubuchat.com
CORS_ORIGIN=https://bubuchat.vercel.app
```

**Frontend (Vercel):**

```env
VITE_API_URL=https://bubuchat-backend.onrender.com
VITE_SOCKET_URL=https://bubuchat-backend.onrender.com
```

---

## 🔧 Important Considerations

### Render Free Tier Limitations

⚠️ **Auto-Sleep After 15 Minutes of Inactivity**

**Problem:** Free tier services sleep after 15 min of no requests.

- First request after sleep takes ~30 seconds to wake up
- Users will experience delay on first visit

**Solutions:**

**Option 1: Accept the Delay** (Simplest)

- Show loading message: "Waking up server, please wait..."
- Most users won't notice after first load

**Option 2: Keep-Alive Ping** (External Service)

- Use [UptimeRobot](https://uptimerobot.com/) (Free)
- Ping your backend every 5 minutes
- Keeps service awake 24/7

**Setup UptimeRobot:**

1. Sign up at UptimeRobot.com
2. Add New Monitor:
   - Type: HTTP(s)
   - URL: `https://bubuchat-backend.onrender.com/health`
   - Interval: 5 minutes
3. This keeps your backend alive

**Option 3: Upgrade to Paid** ($7/month)

- No sleep
- Better performance
- Still cheaper than AWS EC2

---

### MongoDB Atlas Free Tier (M0) Limitations

- **Storage:** 512MB (plenty for chat app)
- **Connections:** 500 concurrent max
- **Backups:** Manual only (no auto-backups)

**If you exceed 512MB:**

- Upgrade to M2 ($9/month) for 2GB
- Or implement data retention policy (delete old messages)

---

### Upstash Redis Free Tier

- **10,000 commands per day**
- **10MB max data size**
- **Global replication**

**If you exceed limits:**

- Upgrade to Pay-as-you-go ($0.20 per 100K commands)
- Or optimize Redis usage (use for PubSub only, not session storage)

---

### WebSocket Considerations

**Render supports WebSockets** but:

- Free tier has connection time limits
- May disconnect after 5 minutes of inactivity
- Implement reconnection logic (already in your code ✅)

---

## 🧪 Testing Checklist

After deployment, test all features:

- [ ] **Registration & Login**

  ```bash
  curl -X POST https://bubuchat-backend.onrender.com/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"username":"test","email":"test@test.com","password":"test123","displayName":"Test"}'
  ```

- [ ] **Frontend Loads**

  - Visit: `https://bubuchat.vercel.app`
  - Should see login screen

- [ ] **WebSocket Connection**

  - Login as two users
  - Send message
  - Should receive instantly

- [ ] **Push Notifications**

  - Enable notifications
  - Close PWA
  - Send message from another device
  - Should receive push notification

- [ ] **PWA Installation**

  - Visit on mobile
  - "Add to Home Screen" should appear
  - Install and test offline

- [ ] **Friend Requests**
  - Send friend request
  - Accept request
  - Start chatting

---

## 🔄 Auto-Deployment Setup

Enable automatic deployments on git push:

**Render:**

- Already auto-deploys on push to `main` branch ✅

**Vercel:**

- Already auto-deploys on push to `main` branch ✅

**Workflow:**

```bash
# Make changes
git add .
git commit -m "Add new feature"
git push

# Render automatically deploys backend
# Vercel automatically deploys frontend
# Wait 2-3 minutes → Changes live!
```

---

## 📊 Monitoring

### Render Monitoring

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on `bubuchat-backend`
3. View:
   - **Logs** (real-time)
   - **Metrics** (CPU, Memory)
   - **Deploys** (history)

### MongoDB Atlas Monitoring

1. Go to [Atlas Dashboard](https://cloud.mongodb.com/)
2. Click on your cluster
3. View:
   - **Metrics** (connections, operations)
   - **Performance** (slow queries)
   - **Storage** (usage)

### Upstash Monitoring

1. Go to [Upstash Dashboard](https://console.upstash.com/)
2. Click on your database
3. View:
   - **Commands** (daily usage)
   - **Latency**
   - **Storage**

---

## 🛠️ Troubleshooting

### Backend Won't Start on Render

**Check Logs:**

```
Render Dashboard → bubuchat-backend → Logs
```

**Common Issues:**

1. **Missing Environment Variables**

   - Go to Environment tab
   - Add missing vars

2. **Build Failed**

   - Check `package.json` scripts
   - Ensure `build` command exists

3. **Port Issues**
   - Render uses `process.env.PORT` (already handled)

### Frontend Can't Connect to Backend

**Check CORS:**

```javascript
// In server, ensure CORS_ORIGIN matches frontend URL
CORS_ORIGIN=https://bubuchat.vercel.app
```

**Check API URL:**

```javascript
// In client/src/config/constants.ts
export const API_BASE_URL = "https://bubuchat-backend.onrender.com";
```

### MongoDB Connection Issues

**Check Connection String:**

- Must include database name: `/realtime-chat`
- Password must be URL-encoded
- IP whitelist includes 0.0.0.0/0

**Test Connection:**

```bash
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/realtime-chat"
```

### Redis Connection Issues

**Check Redis URL Format:**

```
redis://default:PASSWORD@hostname:6379
```

**Test Connection:**

```bash
redis-cli -u redis://default:PASSWORD@hostname:6379 PING
```

---

## 💰 Cost Comparison

### Before (AWS)

| Service       | Cost/Month     |
| ------------- | -------------- |
| EC2 t2.micro  | $8.50          |
| Data Transfer | $1-2           |
| **Total**     | **~$10/mo**    |
| **Annual**    | **~$120/year** |

### After (Free Platforms)

| Service            | Cost/Month  |
| ------------------ | ----------- |
| Render Free        | $0          |
| MongoDB Atlas M0   | $0          |
| Upstash Redis Free | $0          |
| Vercel Free        | $0          |
| **Total**          | **$0/mo**   |
| **Annual**         | **$0/year** |

### **Savings: $120/year** 💰

---

## 🚀 Next Steps

### Optional Enhancements

1. **Custom Domain** (Free)

   - Vercel: Settings → Domains → Add custom domain
   - Render: Settings → Custom Domain

2. **Monitoring Alerts**

   - UptimeRobot: Email alerts when backend goes down
   - Sentry: Error tracking (free tier)

3. **Analytics**

   - Google Analytics (free)
   - Vercel Analytics (free)

4. **Database Backups**
   - MongoDB Atlas: Manual exports weekly
   - Automate with GitHub Actions

---

## 📝 Summary

✅ **What You Get:**

- Fully functional chat app
- All features working (WebSocket, Push, PWA)
- Automatic SSL/HTTPS
- Auto-deployment on git push
- Global CDN (faster load times)
- Better reliability than single EC2 instance

✅ **What You Save:**

- $120/year in AWS costs
- No server management
- No SSL certificate management
- No PM2 management
- No Nginx configuration

✅ **Trade-offs:**

- Backend sleeps after 15min inactivity (use UptimeRobot to solve)
- 512MB MongoDB storage (sufficient for most use cases)
- 10K Redis commands/day (plenty for small-medium apps)

---

## 🎯 Quick Migration Commands

```bash
# 1. Update code for new platform
cd c:\Users\HP\Desktop\realtime-chat

# 2. Update frontend config
cd client
# Edit .env.production with new backend URL

# 3. Commit and push
git add .
git commit -m "Migrate to free platforms"
git push

# 4. Deploy backend to Render (via dashboard)
# 5. Deploy frontend to Vercel (via dashboard or CLI)
vercel --prod

# Done! Your app is now running on free platforms!
```

---

## 📞 Support

If you encounter issues:

1. **Check Logs:**

   - Render: Dashboard → Service → Logs
   - Vercel: Dashboard → Deployment → Function Logs
   - MongoDB: Atlas → Monitoring
   - Upstash: Console → Metrics

2. **Common Resources:**
   - [Render Docs](https://render.com/docs)
   - [Vercel Docs](https://vercel.com/docs)
   - [MongoDB Atlas Docs](https://www.mongodb.com/docs/atlas/)
   - [Upstash Docs](https://upstash.com/docs/redis)

---

**🎉 Congratulations! You've successfully migrated to 100% free hosting while maintaining all features!**
