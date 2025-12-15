# 🚀 Free Deployment Checklist

Follow this step-by-step checklist to migrate from AWS to free platforms.

---

## ✅ Pre-Deployment Setup (30 minutes)

### 1. Create Accounts

- [ ] **MongoDB Atlas** - https://www.mongodb.com/cloud/atlas/register
- [ ] **Upstash Redis** - https://upstash.com/
- [ ] **Render** - https://render.com/
- [ ] **Vercel** - https://vercel.com/
- [ ] **GitHub** - https://github.com/ (if you don't have)

### 2. MongoDB Atlas Setup

- [ ] Create free M0 cluster (512MB)
- [ ] Name: `bubuchat-cluster`
- [ ] Region: Choose closest to you
- [ ] Create database user: `bubuchat-admin` with password
- [ ] Network Access: Allow 0.0.0.0/0 (all IPs)
- [ ] Get connection string:
  ```
  mongodb+srv://bubuchat-admin:PASSWORD@cluster.xxxxx.mongodb.net/realtime-chat?retryWrites=true&w=majority
  ```
- [ ] Save connection string securely

### 3. Upstash Redis Setup

- [ ] Create free global database
- [ ] Name: `bubuchat-redis`
- [ ] Type: Global
- [ ] Get Redis URL:
  ```
  redis://default:PASSWORD@region.upstash.io:6379
  ```
- [ ] Save Redis URL securely

### 4. GitHub Repository Setup

- [ ] Create new repository on GitHub: `bubuchat`
- [ ] Make it private (or public if you prefer)
- [ ] Initialize git in your project:
  ```powershell
  cd c:\Users\HP\Desktop\realtime-chat
  git init
  git add .
  git commit -m "Initial commit for free deployment"
  git remote add origin https://github.com/YOUR_USERNAME/bubuchat.git
  git branch -M main
  git push -u origin main
  ```

---

## 🔧 Configuration Updates (15 minutes)

### 5. Update Project Files

- [ ] **Create/Update `render.yaml`** in project root (already created ✅)
- [ ] **Create/Update `client/.env.production`** (already created ✅)
- [ ] **Create/Update `client/vercel.json`** (already created ✅)
- [ ] **Update `client/src/config/constants.ts`** (already updated ✅)

### 6. Generate VAPID Keys (if not done)

If you don't have VAPID keys yet:

```powershell
cd server
npx web-push generate-vapid-keys
```

Save the output:
```
Public Key: BHuTBvbPG3o34gpIsW...
Private Key: pec1N8RZEiM503nKK...
```

### 7. Generate JWT Secrets

```powershell
# In PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

Run twice to get two different secrets:
- [ ] JWT_SECRET: `<save this>`
- [ ] JWT_REFRESH_SECRET: `<save this>`

---

## 🌐 Backend Deployment to Render (20 minutes)

### 8. Deploy Backend

- [ ] Go to https://dashboard.render.com/
- [ ] Click **"New +"** → **"Web Service"**
- [ ] Connect GitHub account
- [ ] Select repository: `bubuchat`
- [ ] Configure service:
  - **Name:** `bubuchat-backend`
  - **Region:** Oregon (or closest)
  - **Branch:** `main`
  - **Root Directory:** (leave empty)
  - **Environment:** Node
  - **Build Command:** `cd server && npm install && npm run build`
  - **Start Command:** `cd server && npm start`
  - **Plan:** Free

### 9. Add Environment Variables on Render

Click **"Advanced"** → Add these variables:

```env
NODE_ENV=production
PORT=10000
SERVER_ID=render-server-1
CHANNEL=chat-channel
MONGODB_URI=<paste your MongoDB Atlas connection string>
REDIS_URL=<paste your Upstash Redis URL>
JWT_SECRET=<paste your generated JWT secret>
JWT_REFRESH_SECRET=<paste your generated JWT refresh secret>
VAPID_PUBLIC_KEY=<paste your VAPID public key>
VAPID_PRIVATE_KEY=<paste your VAPID private key>
VAPID_SUBJECT=mailto:admin@bubuchat.com
CORS_ORIGIN=https://bubuchat.vercel.app
```

- [ ] All environment variables added
- [ ] Click **"Create Web Service"**
- [ ] Wait for deployment (5-10 minutes)
- [ ] Save backend URL: `https://bubuchat-backend.onrender.com`

### 10. Test Backend

```powershell
curl https://bubuchat-backend.onrender.com/health
```

Should return: `{"status":"ok","server":"render-server-1"}`

- [ ] Backend health check passes ✅

---

## 🎨 Frontend Deployment to Vercel (15 minutes)

### 11. Update Frontend URLs

- [ ] Edit `client/.env.production`:
  ```env
  VITE_API_URL=https://bubuchat-backend.onrender.com
  VITE_SOCKET_URL=https://bubuchat-backend.onrender.com
  ```

- [ ] Commit and push:
  ```powershell
  git add .
  git commit -m "Update API URLs for Vercel deployment"
  git push
  ```

### 12. Deploy to Vercel

**Option A: Via Vercel CLI**

```powershell
# Install Vercel CLI globally
npm install -g vercel

# Navigate to client folder
cd client

# Login
vercel login

# Deploy
vercel --prod
```

**Option B: Via Vercel Dashboard**

- [ ] Go to https://vercel.com/dashboard
- [ ] Click **"Add New..."** → **"Project"**
- [ ] Import `bubuchat` repository
- [ ] Configure:
  - **Framework:** Vite
  - **Root Directory:** `client`
  - **Build Command:** `npm run build`
  - **Output Directory:** `dist`
  - **Install Command:** `npm install`
- [ ] Add Environment Variables:
  ```
  VITE_API_URL=https://bubuchat-backend.onrender.com
  VITE_SOCKET_URL=https://bubuchat-backend.onrender.com
  ```
- [ ] Click **"Deploy"**
- [ ] Wait for deployment (3-5 minutes)
- [ ] Save frontend URL: `https://bubuchat.vercel.app`

### 13. Test Frontend

- [ ] Visit: `https://bubuchat.vercel.app`
- [ ] Should load login/register screen ✅

---

## 🔄 Update CORS (5 minutes)

### 14. Update Backend CORS

Now that you have the Vercel URL:

- [ ] Go to Render Dashboard → `bubuchat-backend`
- [ ] Click **"Environment"** tab
- [ ] Edit `CORS_ORIGIN`:
  ```
  CORS_ORIGIN=https://bubuchat.vercel.app
  ```
- [ ] Click **"Save Changes"**
- [ ] Service will auto-redeploy (2-3 minutes)

---

## 📦 Data Migration (Optional - 15 minutes)

### 15. Migrate Existing Data from AWS

If you have data on AWS MongoDB:

**Export from AWS:**

```powershell
# SSH to AWS
ssh root@13.49.78.104

# Export
mongodump --uri="mongodb://localhost:27017/realtime-chat" --out=/tmp/backup

# Compress
cd /tmp
tar -czf backup.tar.gz backup

# Download to Windows
# On local machine:
scp root@13.49.78.104:/tmp/backup.tar.gz C:\Users\HP\Desktop\
```

**Import to Atlas:**

```powershell
# Extract
tar -xzf backup.tar.gz

# Import
mongorestore --uri="mongodb+srv://bubuchat-admin:PASSWORD@cluster.mongodb.net/realtime-chat" backup/realtime-chat
```

- [ ] Data migrated successfully ✅

---

## 🧪 Full Testing (20 minutes)

### 16. Test All Features

**Basic Authentication:**
- [ ] Register new user on Vercel frontend
- [ ] Login with credentials
- [ ] JWT token works

**Messaging:**
- [ ] Open two browsers (different users)
- [ ] Send friend request
- [ ] Accept friend request
- [ ] Send messages
- [ ] Messages appear in real-time ✅

**WebSocket:**
- [ ] Send message
- [ ] Typing indicator works
- [ ] Real-time delivery works ✅

**Push Notifications:**
- [ ] Enable notifications (bell icon)
- [ ] Check browser permission granted
- [ ] Minimize browser/PWA
- [ ] Send message from another user
- [ ] Receive push notification ✅

**PWA Installation:**
- [ ] Visit on mobile browser
- [ ] "Add to Home Screen" appears
- [ ] Install PWA
- [ ] Works offline (cached assets)
- [ ] Push notifications work when app closed ✅

**Offline Notifications:**
- [ ] User A online
- [ ] User B completely closes app (offline)
- [ ] User A sends message to User B
- [ ] User B receives push notification ✅
- [ ] User B opens app
- [ ] Message is there ✅

---

## 🎯 Optional Enhancements

### 17. Keep Backend Awake (Prevents 15-min sleep)

**Setup UptimeRobot:**

- [ ] Sign up at https://uptimerobot.com/
- [ ] Add New Monitor:
  - Type: HTTP(s)
  - URL: `https://bubuchat-backend.onrender.com/health`
  - Monitoring Interval: 5 minutes
- [ ] Backend now stays awake 24/7 ✅

### 18. Custom Domain (Optional)

**On Vercel:**
- [ ] Go to Project Settings → Domains
- [ ] Add custom domain: `bubuchat.yourdomain.com`
- [ ] Add DNS records as instructed
- [ ] SSL automatically configured ✅

**On Render:**
- [ ] Go to Service Settings → Custom Domain
- [ ] Add custom domain: `api.bubuchat.yourdomain.com`
- [ ] Add DNS records
- [ ] Update CORS on Render
- [ ] Update frontend URLs to use custom domain

### 19. Monitoring & Alerts

**Error Tracking:**
- [ ] Sign up for Sentry (free tier)
- [ ] Add Sentry to frontend and backend
- [ ] Receive error alerts

**Uptime Alerts:**
- [ ] UptimeRobot sends email when backend down
- [ ] Vercel sends email on deployment failures

### 20. Database Backups

**Manual Backups:**
```powershell
# Weekly backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/realtime-chat" --out=C:\backups\$(Get-Date -Format "yyyy-MM-dd")
```

**Automated Backups:**
- [ ] Create GitHub Action to backup weekly
- [ ] Store backups in GitHub (private repo) or cloud storage

---

## 📊 Performance Optimization

### 21. Optimize for Production

**Frontend:**
- [ ] PWA caches assets (already done ✅)
- [ ] Code splitting enabled (Vite does this ✅)
- [ ] Images optimized (check file sizes)

**Backend:**
- [ ] MongoDB indexes created (already done ✅)
- [ ] Redis used for PubSub (already done ✅)
- [ ] Rate limiting enabled (add if needed)

**Monitoring:**
- [ ] Check MongoDB Atlas metrics
- [ ] Check Upstash Redis usage
- [ ] Check Render logs for errors

---

## 🎉 Post-Deployment Verification

### 22. Final Checks

- [ ] **Frontend loads:** https://bubuchat.vercel.app ✅
- [ ] **Backend responds:** https://bubuchat-backend.onrender.com/health ✅
- [ ] **WebSocket connects** ✅
- [ ] **Messages send/receive** ✅
- [ ] **Push notifications work** ✅
- [ ] **PWA installs on mobile** ✅
- [ ] **Auto-deployment works** (push to GitHub → auto-redeploys) ✅

### 23. Update Documentation

- [ ] Update README.md with new URLs
- [ ] Document environment variables
- [ ] Add troubleshooting section

---

## 🗑️ Cleanup Old AWS Resources

### 24. Decommission AWS (Once everything works)

- [ ] **Stop EC2 instance**
- [ ] **Terminate EC2 instance**
- [ ] **Delete AWS MongoDB data** (if migrated)
- [ ] **Remove AWS security groups**
- [ ] **Cancel AWS billing** (check for any charges)

**Save $120/year!** 💰

---

## 📈 Usage Monitoring

### 25. Track Your Usage (Stay within free limits)

**MongoDB Atlas:**
- Free tier: 512MB storage
- Check: Atlas Dashboard → Cluster → Metrics
- [ ] Currently using: _____MB / 512MB

**Upstash Redis:**
- Free tier: 10,000 commands/day
- Check: Upstash Console → Database → Metrics
- [ ] Currently using: _____commands / 10,000/day

**Render:**
- Free tier: 750 hours/month (one service)
- Auto-sleeps after 15min inactivity
- Check: Render Dashboard → Service → Metrics
- [ ] Using UptimeRobot to keep awake: Yes/No

**Vercel:**
- Free tier: 100GB bandwidth/month
- Check: Vercel Dashboard → Usage
- [ ] Currently using: _____GB / 100GB

---

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check Render logs for errors
- Verify all environment variables are set
- Check MongoDB connection string is correct

**Frontend can't connect:**
- Verify CORS_ORIGIN matches Vercel URL
- Check VITE_API_URL is correct
- Hard refresh browser (Ctrl+Shift+R)

**Push notifications not working:**
- Check VAPID keys are set correctly
- Verify user has granted browser permission
- Check subscription exists in MongoDB

**WebSocket disconnects:**
- Normal for Render free tier (reconnects automatically)
- Check reconnection logic in client code

---

## ✅ Deployment Complete!

**Your app is now running on 100% FREE infrastructure!**

- **Frontend:** https://bubuchat.vercel.app
- **Backend:** https://bubuchat-backend.onrender.com
- **Database:** MongoDB Atlas (Cloud)
- **Cache:** Upstash Redis (Cloud)

**Total Cost: $0/month** 🎉

**Next Steps:**
1. Share your app with friends
2. Monitor usage to stay within free limits
3. Consider upgrading if you exceed limits
4. Enjoy your fully-featured chat app!

---

## 📝 Notes

**Free Tier Limitations to Remember:**

1. **Render**: Backend sleeps after 15 min inactivity (use UptimeRobot)
2. **MongoDB**: 512MB storage max (implement data retention if needed)
3. **Upstash**: 10K commands/day (sufficient for most use cases)
4. **Vercel**: 100GB bandwidth/month (plenty for chat app)

**When to Consider Upgrading:**

- More than 100 active users
- Need 24/7 uptime without sleep
- Exceed storage limits
- Need faster performance

**Paid Tier Costs (if needed):**
- Render: $7/month (no sleep)
- MongoDB: $9/month (2GB storage)
- Upstash: Pay-as-you-go ($0.20/100K commands)
- Vercel: $20/month (pro features)

**Still cheaper than AWS! ($36/month vs $10/month AWS + better features)**

---

**Date Deployed:** _______________
**Deployed By:** _______________
**Version:** 1.0.0
