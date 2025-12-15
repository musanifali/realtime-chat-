// client/src/components/NotificationToggle/NotificationToggle.tsx

import { useState, useEffect } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { notificationService } from '../../services/NotificationService';
import { pushNotificationService } from '../../services/PushNotificationService';
import { soundManager } from '../../services/SoundManager';

export function NotificationToggle() {
  const [enabled, setEnabled] = useState(notificationService.isEnabled());

  useEffect(() => {
    setEnabled(notificationService.isEnabled());
    
    // Initialize push notifications
    pushNotificationService.initialize();
  }, []);

  const handleToggle = async () => {
    soundManager.playClick();

    // If notifications are currently disabled, enable them and request permission
    if (!enabled) {
      const granted = await notificationService.requestPermission();
      if (granted) {
        notificationService.enable();
        setEnabled(true);
        
        // Also subscribe to push notifications for background notifications
        await pushNotificationService.subscribe();
      }
    } else {
      // If enabled, just disable them
      notificationService.disable();
      setEnabled(false);
      
      // Also unsubscribe from push notifications
      await pushNotificationService.unsubscribe();
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="p-2 rounded-lg border-3 border-black transition-all duration-200 flex items-center justify-center"
      style={{
        backgroundColor: enabled ? 'var(--color-success)' : 'var(--color-error)',
        boxShadow: '3px 3px 0 var(--color-border)',
        transform: 'rotate(-1deg)',
      }}
      title={enabled ? 'Notifications ON' : 'Notifications OFF'}
    >
      {enabled ? (
        <Bell className="w-5 h-5" style={{ color: 'white' }} />
      ) : (
        <BellOff className="w-5 h-5" style={{ color: 'white' }} />
      )}
    </button>
  );
}
