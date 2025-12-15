// server/src/services/PushNotificationService.ts

import webpush from 'web-push';
import { PushSubscription } from '../models/PushSubscription.js';
import { env } from '../config/env.js';
import mongoose from 'mongoose';

// VAPID keys configuration from environment
const VAPID_PUBLIC_KEY = env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = env.VAPID_SUBJECT;

// Configure web-push
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
}

export class PushNotificationService {
  /**
   * Save push subscription for a user
   */
  static async saveSubscription(
    userId: string,
    endpoint: string,
    keys: { p256dh: string; auth: string }
  ): Promise<void> {
    try {
      await PushSubscription.findOneAndUpdate(
        { endpoint },
        {
          userId: new mongoose.Types.ObjectId(userId),
          endpoint,
          keys,
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Push subscription saved for user: ${userId}`);
    } catch (error) {
      console.error('❌ Error saving push subscription:', error);
      throw error;
    }
  }

  /**
   * Remove push subscription
   */
  static async removeSubscription(endpoint: string): Promise<void> {
    try {
      await PushSubscription.deleteOne({ endpoint });
      console.log(`✅ Push subscription removed: ${endpoint}`);
    } catch (error) {
      console.error('❌ Error removing push subscription:', error);
      throw error;
    }
  }

  /**
   * Get all subscriptions for a user
   */
  static async getUserSubscriptions(userId: string): Promise<any[]> {
    try {
      const subscriptions = await PushSubscription.find({
        userId: new mongoose.Types.ObjectId(userId),
      });
      return subscriptions;
    } catch (error) {
      console.error('❌ Error getting user subscriptions:', error);
      return [];
    }
  }

  /**
   * Send push notification to a user
   */
  static async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    try {
      const subscriptions = await this.getUserSubscriptions(userId);

      if (subscriptions.length === 0) {
        console.log(`ℹ️ No push subscriptions found for user: ${userId}`);
        return;
      }

      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/pwa-192x192.png',
        badge: payload.badge || '/pwa-192x192.png',
        tag: payload.tag || 'notification',
        notificationType: payload.data?.type || 'message', // For custom vibration patterns
        data: payload.data || {},
      });

      const promises = subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
              },
            },
            pushPayload
          );
          console.log(`✅ Push notification sent to subscription: ${subscription.endpoint.substring(0, 50)}...`);
        } catch (error: any) {
          console.error(`❌ Error sending push notification:`, error);
          
          // If subscription is invalid, remove it
          if (error.statusCode === 410 || error.statusCode === 404) {
            console.log(`🗑️ Removing invalid subscription: ${subscription.endpoint.substring(0, 50)}...`);
            await this.removeSubscription(subscription.endpoint);
          }
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('❌ Error sending push notifications to user:', error);
      throw error;
    }
  }

  /**
   * Send message notification to a user
   */
  static async notifyNewMessage(
    userId: string,
    senderName: string,
    message: string
  ): Promise<void> {
    const payload: PushPayload = {
      title: '💬 BubuChat',
      body: 'You have a new message!', // Generic message for privacy
      tag: `message-${Date.now()}`, // Unique tag to show multiple notifications
      data: {
        type: 'message', // Will trigger longer vibration pattern
        sender: senderName,
        url: '/',
      },
    };

    await this.sendToUser(userId, payload);
  }

  /**
   * Send friend request notification
   */
  static async notifyFriendRequest(
    userId: string,
    requesterName: string
  ): Promise<void> {
    const payload: PushPayload = {
      title: '👋 New Friend Request',
      body: `${requesterName} wants to be your friend!`,
      tag: 'friend-request',
      data: {
        type: 'friend_request',
        requester: requesterName,
        url: '/',
      },
    };

    await this.sendToUser(userId, payload);
  }

  /**
   * Send friend request accepted notification
   */
  static async notifyFriendAccepted(
    userId: string,
    friendName: string
  ): Promise<void> {
    const payload: PushPayload = {
      title: '✅ Friend Request Accepted',
      body: `${friendName} accepted your friend request!`,
      tag: 'friend-accepted',
      data: {
        type: 'friend_accepted',
        friend: friendName,
        url: '/',
      },
    };

    await this.sendToUser(userId, payload);
  }
}
