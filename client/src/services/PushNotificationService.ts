// client/src/services/PushNotificationService.ts

import { notificationService } from './NotificationService';
import { API_BASE_URL } from '../config/constants';

interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private refreshInterval: number | null = null;

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    try {
      // Check if service worker and push notifications are supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications are not supported');
        return false;
      }

      // Get service worker registration
      this.registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      if (this.subscription) {
        console.log('✅ Found existing push subscription');
        // Refresh the subscription with server to ensure it's still valid
        await this.sendSubscriptionToServer(this.subscription);
        // Start periodic refresh
        this.startSubscriptionRefresh();
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Start periodic subscription refresh to keep it alive
   */
  private startSubscriptionRefresh(): void {
    // Clear existing interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }

    // Refresh subscription every 4 minutes to prevent expiration
    this.refreshInterval = window.setInterval(async () => {
      try {
        if (this.subscription && this.registration) {
          console.log('🔄 Refreshing push subscription...');
          // Check if subscription is still valid
          const currentSub = await this.registration.pushManager.getSubscription();
          
          if (!currentSub) {
            console.warn('⚠️ Push subscription lost, resubscribing...');
            // Re-subscribe if lost
            const notificationsEnabled = localStorage.getItem('notifications_enabled') !== 'false';
            if (notificationsEnabled) {
              await this.subscribe();
            }
          } else {
            // Refresh with server
            await this.sendSubscriptionToServer(currentSub);
            this.subscription = currentSub;
            console.log('✅ Push subscription refreshed');
          }
        }
      } catch (error) {
        console.error('❌ Error refreshing push subscription:', error);
      }
    }, 4 * 60 * 1000); // 4 minutes
  }

  /**
   * Stop subscription refresh
   */
  private stopSubscriptionRefresh(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<boolean> {
    try {
      // First request notification permission
      const permissionGranted = await notificationService.requestPermission();
      if (!permissionGranted) {
        console.warn('Notification permission not granted');
        return false;
      }

      // Initialize if not already done
      if (!this.registration) {
        const initialized = await this.initialize();
        if (!initialized) {
          return false;
        }
      }

      // Check if already subscribed
      if (this.subscription) {
        console.log('Already subscribed');
        await this.sendSubscriptionToServer(this.subscription);
        return true;
      }

      // VAPID public key - Generated from npx web-push generate-vapid-keys
      const vapidPublicKey = 'BHuTBvbPG3o34gpIsWOxMBW_vDSG0QH7ybmBybvAMXAreiIjRekqxLrCS0o3uwNuEvHD368DUhqeUV1RVU7M5xU';
      
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey);

      // Subscribe to push notifications
      this.subscription = await this.registration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as BufferSource,
      });

      console.log('✅ Push notification subscription successful');

      // Send subscription to your server
      await this.sendSubscriptionToServer(this.subscription);

      // Start periodic refresh to keep subscription alive
      this.startSubscriptionRefresh();

      return true;
    } catch (error) {
      console.error('❌ Error subscribing to push notifications:', error);
      return false;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    try {
      // Stop refresh interval
      this.stopSubscriptionRefresh();

      if (!this.subscription) {
        console.warn('No active subscription to unsubscribe');
        return false;
      }

      await this.subscription.unsubscribe();
      
      // Remove subscription from server
      await this.removeSubscriptionFromServer(this.subscription);

      this.subscription = null;
      console.log('✅ Unsubscribed from push notifications');
      
      return true;
    } catch (error) {
      console.error('❌ Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      };

      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/push/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('Subscription sent to server successfully');
    } catch (error) {
      console.error('Error sending subscription to server:', error);
      // Don't throw - subscription is still active locally
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_BASE_URL}/api/push/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }

      console.log('Subscription removed from server successfully');
    } catch (error) {
      console.error('Error removing subscription from server:', error);
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Convert ArrayBuffer to Base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  /**
   * Check if subscribed
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Get current subscription
   */
  getSubscription(): PushSubscription | null {
    return this.subscription;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
