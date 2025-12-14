// server/src/controllers/MessageController.ts

import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Message } from '../models/Message.js';
import { Friendship } from '../models/Friendship.js';
import { User } from '../models/User.js';

export class MessageController {
  // Get message history with a friend
  static async getMessageHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { friendUsername } = req.params;
      const { limit = 50, before } = req.query;

      console.log(`📚 Getting message history: user=${userId}, friend=${friendUsername}, limit=${limit}`);

      // Find friend user
      const friend = await User.findOne({ username: friendUsername });
      if (!friend) {
        console.log(`❌ Friend not found: ${friendUsername}`);
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify friendship
      const areFriends = await Friendship.areFriends(userId, friend._id.toString());
      if (!areFriends) {
        console.log(`❌ Not friends: ${userId} <-> ${friend._id}`);
        res.status(403).json({ error: 'You can only view messages with friends' });
        return;
      }

      // Build query - get ALL messages between these two users (both sent and received)
      const query: any = {
        $or: [
          { sender: userId, recipient: friend._id },
          { sender: friend._id, recipient: userId }
        ]
      };

      // Pagination - messages before a certain timestamp
      if (before) {
        query.createdAt = { $lt: new Date(before as string) };
      }

      // Get messages - sorted by newest first for pagination, then reverse
      const messages = await Message.find(query)
        .sort({ createdAt: -1 })
        .limit(Number(limit))
        .populate('sender', 'username displayName avatar')
        .populate('recipient', 'username displayName avatar');

      console.log(`📚 Found ${messages.length} messages between ${userId} and ${friend.username}`);

      // Reverse to get chronological order (oldest first)
      messages.reverse();

      // Format messages
      const formattedMessages = messages.map((m) => {
        const sender = m.sender as any;
        const recipient = m.recipient as any;
        return {
          id: m._id.toString(),
          message: m.message,
          sender: {
            id: sender._id.toString(),
            username: sender.username,
            displayName: sender.displayName,
            avatar: sender.avatar,
          },
          recipient: {
            id: recipient._id.toString(),
            username: recipient.username,
            displayName: recipient.displayName,
            avatar: recipient.avatar,
          },
          isRead: m.isRead,
          readAt: m.readAt,
          createdAt: m.createdAt,
        };
      });

      console.log(`✅ Returning ${formattedMessages.length} formatted messages`);

      res.status(200).json({ messages: formattedMessages });
    } catch (error: any) {
      console.error('Get message history error:', error);
      res.status(500).json({ error: 'Failed to get message history' });
    }
  }

  // Mark messages as read
  static async markMessagesAsRead(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { friendUsername } = req.params;

      console.log(`📖 Marking messages as read: user=${userId}, friend=${friendUsername}`);

      // Find friend user
      const friend = await User.findOne({ username: friendUsername });
      if (!friend) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Mark all unread messages from friend as read
      const result = await Message.updateMany(
        {
          sender: friend._id,
          recipient: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
            readAt: new Date(),
          }
        }
      );

      console.log(`✅ Marked ${result.modifiedCount} messages as read from ${friendUsername}`);

      res.status(200).json({ 
        message: 'Messages marked as read',
        count: result.modifiedCount 
      });
    } catch (error: any) {
      console.error('Mark messages as read error:', error);
      res.status(500).json({ error: 'Failed to mark messages as read' });
    }
  }

  // Get unread message count
  static async getUnreadCount(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const count = await Message.countDocuments({
        recipient: userId,
        isRead: false,
      });

      res.status(200).json({ count });
    } catch (error: any) {
      console.error('Get unread count error:', error);
      res.status(500).json({ error: 'Failed to get unread count' });
    }
  }

  // Get unread counts per friend
  static async getUnreadCountsByFriend(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const counts = await Message.aggregate([
        {
          $match: {
            recipient: new mongoose.Types.ObjectId(userId),
            isRead: false,
          }
        },
        {
          $group: {
            _id: '$sender',
            count: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'sender'
          }
        },
        {
          $unwind: '$sender'
        },
        {
          $project: {
            username: '$sender.username',
            count: 1
          }
        }
      ]);

      res.status(200).json({ counts });
    } catch (error: any) {
      console.error('Get unread counts by friend error:', error);
      res.status(500).json({ error: 'Failed to get unread counts' });
    }
  }

  // Get all pending/unread messages
  static async getPendingMessages(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      console.log(`📥 Getting pending messages for user: ${userId}`);

      // Get all unread messages sent to this user
      const messages = await Message.find({
        recipient: userId,
        isRead: false,
      })
        .sort({ createdAt: 1 }) // Oldest first
        .populate('sender', 'username displayName avatar')
        .populate('recipient', 'username displayName avatar');

      console.log(`📥 Found ${messages.length} pending messages for user ${userId}`);

      // Format messages
      const formattedMessages = messages.map((m) => {
        const sender = m.sender as any;
        const recipient = m.recipient as any;
        return {
          id: m._id.toString(),
          message: m.message,
          sender: {
            id: sender._id.toString(),
            username: sender.username,
            displayName: sender.displayName,
            avatar: sender.avatar,
          },
          recipient: {
            id: recipient._id.toString(),
            username: recipient.username,
            displayName: recipient.displayName,
            avatar: recipient.avatar,
          },
          isRead: m.isRead,
          readAt: m.readAt,
          createdAt: m.createdAt,
        };
      });

      console.log(`✅ Returning ${formattedMessages.length} formatted pending messages`);

      res.status(200).json({ messages: formattedMessages });
    } catch (error: any) {
      console.error('Get pending messages error:', error);
      res.status(500).json({ error: 'Failed to get pending messages' });
    }
  }
}
