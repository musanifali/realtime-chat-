// client/public/sw-push.js
// Custom service worker extension for push notifications

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  
  if (!event.data) {
    console.log('[Service Worker] No data in push event');
    return;
  }

  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    return;
  }

  const title = data.title || 'BubuChat';
  
  // Different vibration patterns for different notification types
  let vibrationPattern = [200, 100, 200]; // Default
  
  if (data.notificationType === 'message') {
    vibrationPattern = [200, 100, 200, 100, 200]; // Long pattern for messages
  } else if (data.notificationType === 'friend_request') {
    vibrationPattern = [100, 50, 100]; // Quick pattern for friend requests
  } else if (data.notificationType === 'friend_accepted') {
    vibrationPattern = [300, 100, 300]; // Celebratory pattern
  }
  
  const options = {
    body: data.body || 'You have a new message!',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: data.tag || 'notification',
    data: {
      ...data.data,
      notificationType: data.notificationType || 'message',
    },
    requireInteraction: false,
    silent: false, // System will use default notification sound
    vibrate: vibrationPattern,
    renotify: true,
  };

  console.log('[Service Worker] Showing notification with title:', title);
  console.log('[Service Worker] Notification options:', JSON.stringify(options));

  const notificationPromise = self.registration.showNotification(title, options)
    .then(() => {
      console.log('[Service Worker] ✅ Notification displayed successfully');
      return true;
    })
    .catch(error => {
      console.error('[Service Worker] ❌ Failed to show notification:', error);
      console.error('[Service Worker] Error details:', error.name, error.message);
      throw error;
    });

  event.waitUntil(notificationPromise);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Notification click received.');

  event.notification.close();

  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('[Service Worker] Notification closed.');
});
