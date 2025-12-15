// client/src/services/NotificationService.ts

class NotificationService {
  private permission: NotificationPermission = 'default';
  private enabled: boolean = true;

  constructor() {
    this.checkPermission();
    this.loadSettings();
  }

  /**
   * Check current notification permission
   */
  private checkPermission(): void {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Load notification settings from localStorage
   */
  private loadSettings(): void {
    const saved = localStorage.getItem('notifications_enabled');
    this.enabled = saved !== 'false'; // Enabled by default
  }

  /**
   * Save notification settings to localStorage
   */
  private saveSettings(): void {
    localStorage.setItem('notifications_enabled', String(this.enabled));
  }

  /**
   * Request notification permission from user
   */
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Show a notification
   */
  async show(title: string, options?: NotificationOptions): Promise<void> {
    // Don't show if notifications are disabled
    if (!this.enabled) {
      return;
    }

    // Don't show if window is focused
    if (document.hasFocus()) {
      return;
    }

    // Check if notifications are supported
    if (!('Notification' in window)) {
      return;
    }

    // Request permission if needed
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        return;
      }
    }

    try {
      const notification = new Notification(title, {
        icon: '/pwa-192x192.png',
        badge: '/pwa-192x192.png',
        requireInteraction: false,
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show notification for new message
   */
  async notifyNewMessage(sender: string, message: string, isPrivate: boolean = true): Promise<void> {
    const title = isPrivate ? `💬 ${sender}` : `💬 ${sender} (Room)`;
    const body = message.length > 100 ? message.substring(0, 100) + '...' : message;

    await this.show(title, {
      body,
      tag: `message-${sender}`,
    });
  }

  /**
   * Show notification for friend request
   */
  async notifyFriendRequest(sender: string): Promise<void> {
    await this.show('👋 New Friend Request', {
      body: `${sender} wants to be your friend!`,
      tag: 'friend-request',
    });
  }

  /**
   * Show notification for accepted friend request
   */
  async notifyFriendAccepted(friend: string): Promise<void> {
    await this.show('✅ Friend Request Accepted', {
      body: `${friend} accepted your friend request!`,
      tag: 'friend-accepted',
    });
  }

  /**
   * Show notification for typing indicator
   */
  async notifyTyping(user: string): Promise<void> {
    // Don't show typing notifications if window is focused
    if (document.hasFocus()) {
      return;
    }

    await this.show('✍️ Someone is typing...', {
      body: `${user} is typing a message`,
      tag: `typing-${user}`,
      silent: true,
      requireInteraction: false,
    });
  }

  /**
   * Enable notifications
   */
  enable(): void {
    this.enabled = true;
    this.saveSettings();
  }

  /**
   * Disable notifications
   */
  disable(): void {
    this.enabled = false;
    this.saveSettings();
  }

  /**
   * Toggle notifications on/off
   */
  toggle(): boolean {
    this.enabled = !this.enabled;
    this.saveSettings();
    return this.enabled;
  }

  /**
   * Check if notifications are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Check if permission is granted
   */
  isPermissionGranted(): boolean {
    return this.permission === 'granted';
  }

  /**
   * Get current permission status
   */
  getPermission(): NotificationPermission {
    return this.permission;
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
