// client/public/sw-push.js
// Custom service worker extension for push notifications

self.addEventListener('push', function(event) {
  console.log('[Service Worker] Push Received.');
  console.log(`[Service Worker] Push had this data: "${event.data.text()}"`);

  if (!event.data) {
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[Service Worker] Error parsing push data:', e);
    return;
  }

  const title = data.title || 'BubuChat';
  const options = {
    body: data.body || 'You have a new message!',
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    tag: data.tag || 'notification',
    data: data.data || {},
    requireInteraction: true,  // Keep notification visible until user interacts
    silent: false,  // Play sound
    vibrate: [200, 100, 200],  // Vibration pattern for mobile
    renotify: true,  // Alert user even if notification with same tag exists
  };

  console.log('[Service Worker] Showing notification:', title, options);

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('[Service Worker] ✅ Notification shown successfully');
      })
      .catch(error => {
        console.error('[Service Worker] ❌ Error showing notification:', error);
      })
  );
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
