# Push Notification System - Setup Guide

## Overview

BubuChat now supports **Push Notifications** that work even when:

- ✅ App is in background
- ✅ Phone screen is off
- ✅ Browser/app is closed
- ✅ PWA is installed

## Installation

### 1. Install Server Dependencies

```bash
cd server
npm install web-push
npm install --save-dev @types/web-push
```

### 2. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```

This will output:

```
Public Key: BEl62iUYgUivxIkv...
Private Key: bdSiNzUhUP6piAxLH...
```

### 3. Configure Environment Variables

Add to `server/.env`:

```env
VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@bubuchat.com
```

### 4. Update Client VAPID Key

Edit `client/src/services/PushNotificationService.ts` line 63:

```typescript
const vapidPublicKey = "YOUR_PUBLIC_KEY_HERE"; // Replace with your actual public key
```

## How It Works

### Client Side

1. User clicks bell icon in sidebar
2. Browser requests notification permission
3. Service worker subscribes to push notifications
4. Subscription sent to server and stored in MongoDB

### Server Side

1. When user receives a message
2. Server looks up their push subscriptions
3. Sends push notification via web-push library
4. Notification appears even if app is closed

## Features

### Automatic Notifications For:

- 💬 New messages (with sender name and preview)
- 👋 Friend requests
- ✅ Friend request accepted

### Smart Behavior:

- ❌ No notification if window is focused
- ❌ No notification if user is currently viewing the chat
- ✅ Notifications work across all devices
- ✅ Vibration on mobile devices
- ✅ Click notification to open app

### Database Schema:

```typescript
PushSubscription {
  userId: ObjectId,
  endpoint: string,
  keys: {
    p256dh: string,
    auth: string
  },
  createdAt: Date,
  updatedAt: Date
}
```

## API Endpoints

### Subscribe to Push

```
POST /api/push/subscribe
Authorization: Bearer <token>
Body: {
  endpoint: string,
  keys: {
    p256dh: string,
    auth: string
  }
}
```

### Unsubscribe from Push

```
POST /api/push/unsubscribe
Authorization: Bearer <token>
Body: {
  endpoint: string
}
```

## Testing

### Test on Desktop:

1. Open Chrome/Edge
2. Visit https://bubu.servehttp.com
3. Click bell icon → Allow notifications
4. Open another tab or minimize window
5. Have someone send you a message
6. Notification should appear!

### Test on Mobile:

1. Install PWA (Add to Home Screen)
2. Enable notifications
3. Close the app completely
4. Have someone send you a message
5. Notification appears on lock screen!

## Browser Support

- ✅ Chrome/Edge (Desktop & Android)
- ✅ Firefox (Desktop & Android)
- ✅ Safari (macOS & iOS 16.4+)
- ✅ Opera
- ❌ IE11 (not supported)

## Security

- VAPID keys authenticate your server
- Subscriptions are user-specific
- Push notifications encrypted end-to-end
- Requires user permission (can't spam)

## Troubleshooting

### Notifications not appearing?

1. Check browser notification permission
2. Verify VAPID keys match
3. Check console for errors
4. Ensure HTTPS (required for push)

### Subscription failing?

1. Service worker must be registered
2. Check PWA is properly configured
3. Verify endpoint in MongoDB

### Push not sending?

1. Check server logs for errors
2. Verify web-push package installed
3. Ensure VAPID keys in .env
4. Check recipient has subscription

## Production Deployment

1. Generate new VAPID keys for production
2. Add to production environment variables
3. Update client vapidPublicKey
4. Rebuild and deploy
5. Test thoroughly

## Cost

- ✅ Completely FREE
- No third-party service needed
- Uses browser's native push API
- No message limits

## Next Steps

- Add push notification preferences (mute/unmute per friend)
- Add notification sound customization
- Add rich media notifications (images)
- Add action buttons (Reply, Mark as Read)
