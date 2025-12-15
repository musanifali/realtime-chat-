// server/src/controllers/PushController.ts

import { Request, Response } from 'express';
import { PushNotificationService } from '../services/PushNotificationService.js';

export class PushController {
  /**
   * Subscribe to push notifications
   */
  static async subscribe(req: Request, res: Response): Promise<void> {
    try {
      const { endpoint, keys } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
        res.status(400).json({ error: 'Invalid subscription data' });
        return;
      }

      await PushNotificationService.saveSubscription(userId, endpoint, keys);

      res.status(200).json({ success: true, message: 'Subscribed to push notifications' });
    } catch (error) {
      console.error('Error in push subscribe:', error);
      res.status(500).json({ error: 'Failed to subscribe to push notifications' });
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  static async unsubscribe(req: Request, res: Response): Promise<void> {
    try {
      const { endpoint } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      if (!endpoint) {
        res.status(400).json({ error: 'Endpoint is required' });
        return;
      }

      await PushNotificationService.removeSubscription(endpoint);

      res.status(200).json({ success: true, message: 'Unsubscribed from push notifications' });
    } catch (error) {
      console.error('Error in push unsubscribe:', error);
      res.status(500).json({ error: 'Failed to unsubscribe from push notifications' });
    }
  }
}
