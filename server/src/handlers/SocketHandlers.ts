// server/src/handlers/SocketHandlers.ts

import { Socket } from 'socket.io';
import { RedisService } from '../services/RedisService.js';
import { PubSubService } from '../services/PubSubService.js';
import { BroadcastService } from '../services/BroadcastService.js';
import { PushNotificationService } from '../services/PushNotificationService.js';
import { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '../types/index.js';
import { SERVER_ID } from '../config/constants.js';

type SocketType = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export class SocketHandlers {
  constructor(
    private redisService: RedisService,
    private pubSubService: PubSubService,
    private broadcastService: BroadcastService
  ) {}

  async handleRegister(socket: SocketType, username: string): Promise<void> {
    console.log(`${SERVER_ID}: Register - ${username}`);

    // For JWT auth, user is already authenticated, so allow re-registration
    // Only block if it's a different socket trying to use the same username
    const isAlreadyConnected = await this.redisService.isUsernameTaken(username);
    if (isAlreadyConnected && !socket.data.userId) {
      // Only reject if this is NOT a JWT-authenticated reconnection
      socket.emit('error', `Username "${username}" is already taken`);
      socket.disconnect();
      return;
    }

    // If JWT user is reconnecting, remove old Redis entry first
    if (isAlreadyConnected && socket.data.userId) {
      console.log(`${SERVER_ID}: JWT user ${username} reconnecting`);
      await this.redisService.removeUser(username);
    }

    socket.data.username = username;
    await this.redisService.addUser(username);

    // Update MongoDB status to online
    const { User } = await import('../models/User.js');
    const { Friendship } = await import('../models/Friendship.js');
    const user = await User.findOne({ username });
    if (user) {
      user.status = 'online';
      user.lastSeen = new Date();
      await user.save();

      // Get user's friends and notify them of status change
      const friendships = await Friendship.find({
        status: 'accepted',
        $or: [{ requester: user._id }, { recipient: user._id }],
      }).populate('requester recipient', '_id username');

      // Extract friend usernames
      const friendUsernames = friendships.map((f) => {
        const friendDoc = f.requester._id.toString() === user._id.toString() ? f.recipient : f.requester;
        return (friendDoc as any).username;
      });

      // Broadcast status to friends
      for (const friendUsername of friendUsernames) {
        await this.pubSubService.publishMessage({
          type: 'friend_status_changed',
          username,
          status: 'online',
          to: friendUsername,
        });
      }
    }

    await this.pubSubService.publishMessage({ type: 'user_joined', username });

    console.log(`${SERVER_ID}: ${username} registered`);
    
    // Deliver any undelivered messages to this user
    if (user) {
      await this.deliverPendingMessages(socket, user._id.toString());
    }
  }
  
  private async deliverPendingMessages(socket: SocketType, userId: string): Promise<void> {
    try {
      const { Message } = await import('../models/Message.js');
      const { User } = await import('../models/User.js');
      
      // Get all undelivered messages for this user
      const undeliveredMessages = await Message.find({
        recipient: userId,
        isDelivered: false
      })
      .sort({ createdAt: 1 })
      .populate('sender', 'username')
      .limit(100); // Limit to prevent overwhelming on first connect
      
      if (undeliveredMessages.length === 0) {
        console.log(`${SERVER_ID}: No undelivered messages for user ${userId}`);
        return;
      }
      
      console.log(`${SERVER_ID}: 📨 Delivering ${undeliveredMessages.length} undelivered messages to ${socket.data.username}`);
      
      // Emit each message and mark as delivered
      for (const msg of undeliveredMessages) {
        const sender = msg.sender as any;
        socket.emit('private_message', {
          from: sender.username,
          to: socket.data.username!,
          message: msg.message,
          messageId: msg._id.toString()
        });
        
        // Mark as delivered
        msg.isDelivered = true;
        msg.deliveredAt = new Date();
        await msg.save();
      }
      
      console.log(`${SERVER_ID}: ✅ Delivered ${undeliveredMessages.length} messages to ${socket.data.username}`);
    } catch (error) {
      console.error(`${SERVER_ID}: ❌ Error delivering pending messages:`, error);
    }
  }



  async handlePrivateMessage(socket: SocketType, data: { to: string; message: string; tempId?: string }): Promise<void> {
    const username = socket.data.username;
    const userId = socket.data.userId;
    
    console.log(`${SERVER_ID}: Private message from ${username} to ${data.to}: "${data.message}"`);
    
    if (!username || !userId) {
      console.log(`${SERVER_ID}: ERROR - No username or userId in socket data`);
      return;
    }

    // Check if recipient exists in database (don't require them to be online)
    const recipientUsername = data.to;
    const { User } = await import('../models/User.js');
    const recipient = await User.findOne({ username: recipientUsername });
    
    if (!recipient) {
      console.log(`${SERVER_ID}: ERROR - User "${data.to}" not found`);
      socket.emit('error', `User "${data.to}" not found`);
      return;
    }

    // Check if users are friends before allowing message
    const { Friendship } = await import('../models/Friendship.js');
    
    const areFriends = await Friendship.areFriends(userId, recipient._id.toString());
    
    console.log(`${SERVER_ID}: Friendship check: ${username} <-> ${data.to} = ${areFriends}`);
    
    if (!areFriends) {
      console.log(`${SERVER_ID}: ERROR - Users are not friends`);
      socket.emit('error', `You can only message friends. Send a friend request to "${data.to}" first!`);
      return;
    }

    // Find the friendship to link message
    const friendship = await Friendship.findOne({
      status: 'accepted',
      $or: [
        { requester: userId, recipient: recipient._id },
        { requester: recipient._id, recipient: userId }
      ]
    });

    if (!friendship) {
      socket.emit('error', `Friendship not found`);
      return;
    }

    // Save message to MongoDB
    const { Message } = await import('../models/Message.js');
    const savedMessage = await Message.create({
      sender: userId,
      recipient: recipient._id,
      message: data.message,
      friendship: friendship._id,
    });

    console.log(`${SERVER_ID}: Message saved to DB: ${savedMessage._id}`);

    // Send acknowledgment to sender with message ID
    socket.emit('message_sent', {
      tempId: data.tempId || data.message, // Use client's tempId for matching
      messageId: savedMessage._id.toString(),
      to: data.to,
      timestamp: savedMessage.createdAt
    });
    
    console.log(`${SERVER_ID}: ✅ Sent acknowledgment for tempId: ${data.tempId}`);

    // Publish to recipient only (not to sender)
    await this.pubSubService.publishMessage({
      type: 'private_message',
      from: username,
      to: data.to,
      message: data.message,
      messageId: savedMessage._id.toString()
    });

    // Send push notification ONLY if recipient is offline
    try {
      const isRecipientOnline = await this.redisService.isUsernameTaken(data.to);
      
      if (!isRecipientOnline) {
        // User is offline - send push notification
        await PushNotificationService.notifyNewMessage(
          recipient._id.toString(),
          username,
          data.message
        );
        console.log(`${SERVER_ID}: 📱 Push notification sent to OFFLINE user: ${data.to}`);
      } else {
        console.log(`${SERVER_ID}: ℹ️  User ${data.to} is ONLINE - skipping push notification`);
      }
    } catch (error) {
      console.error(`${SERVER_ID}: ❌ Failed to send push notification:`, error);
      // Don't fail the message if push notification fails
    }

    console.log(`${SERVER_ID}: ${username} → ${data.to} (private): ${data.message}`);
  }

  async handleTypingStart(socket: SocketType, data: { to: string }): Promise<void> {
    const username = socket.data.username;
    if (!username) return;

    console.log(`${SERVER_ID}: ${username} started typing to ${data.to}`);
    
    await this.pubSubService.publishMessage({
      type: 'typing_start',
      from: username,
      to: data.to
    });
  }

  async handleTypingStop(socket: SocketType, data: { to: string }): Promise<void> {
    const username = socket.data.username;
    if (!username) return;

    console.log(`${SERVER_ID}: ${username} stopped typing to ${data.to}`);
    
    await this.pubSubService.publishMessage({
      type: 'typing_stop',
      from: username,
      to: data.to
    });
  }

  async handleMessageReaction(socket: SocketType, data: { messageId: string; emoji: string; to: string }): Promise<void> {
    const username = socket.data.username;
    const userId = socket.data.userId;
    
    console.log(`${SERVER_ID}: Reaction from ${username} on message ${data.messageId}: ${data.emoji}`);
    
    if (!username || !userId) {
      console.log(`${SERVER_ID}: ERROR - No username or userId in socket data`);
      return;
    }

    try {
      const { Message } = await import('../models/Message.js');
      const message = await Message.findById(data.messageId);
      
      if (!message) {
        console.log(`${SERVER_ID}: ERROR - Message ${data.messageId} not found`);
        socket.emit('error', 'Message not found');
        return;
      }

      // Initialize reactions array if it doesn't exist
      if (!message.reactions) {
        message.reactions = [];
      }

      // Find existing reaction from this user with this emoji
      const existingReactionIndex = message.reactions.findIndex(
        (r: any) => r.userId.toString() === userId && r.emoji === data.emoji
      );

      let action: 'add' | 'remove' = 'add';

      if (existingReactionIndex !== -1) {
        // Remove reaction (toggle off)
        message.reactions.splice(existingReactionIndex, 1);
        action = 'remove';
        console.log(`${SERVER_ID}: Removed reaction ${data.emoji} from ${username}`);
      } else {
        // Add reaction
        const mongoose = await import('mongoose');
        message.reactions.push({
          userId: new mongoose.Types.ObjectId(userId),
          emoji: data.emoji,
          createdAt: new Date()
        });
        console.log(`${SERVER_ID}: Added reaction ${data.emoji} from ${username}`);
      }

      await message.save();

      // Broadcast reaction to both users
      await this.pubSubService.publishMessage({
        type: 'message_reaction',
        messageId: data.messageId,
        emoji: data.emoji,
        username,
        to: data.to,
        action
      });

      console.log(`${SERVER_ID}: Reaction broadcast completed for message ${data.messageId}`);
    } catch (error) {
      console.error(`${SERVER_ID}: ❌ Error handling reaction:`, error);
      socket.emit('error', 'Failed to add reaction');
    }
  }

  async handleDisconnect(socket: SocketType): Promise<void> {
    const username = socket.data.username;
    console.log(`${SERVER_ID}: Disconnect - ${username || socket.id}`);

    if (username) {
      await this.redisService.removeUser(username);

      // Update MongoDB status to offline
      const { User } = await import('../models/User.js');
      const { Friendship } = await import('../models/Friendship.js');
      const user = await User.findOne({ username });
      if (user) {
        user.status = 'offline';
        user.lastSeen = new Date();
        await user.save();

        // Get user's friends and notify them of status change
        const friendships = await Friendship.find({
          status: 'accepted',
          $or: [{ requester: user._id }, { recipient: user._id }],
        }).populate('requester recipient', '_id username');

        // Extract friend usernames
        const friendUsernames = friendships.map((f) => {
          const friendDoc = f.requester._id.toString() === user._id.toString() ? f.recipient : f.requester;
          return (friendDoc as any).username;
        });

        // Broadcast status to friends
        for (const friendUsername of friendUsernames) {
          await this.pubSubService.publishMessage({
            type: 'friend_status_changed',
            username,
            status: 'offline',
            to: friendUsername,
          });
        }
      }

      await this.pubSubService.publishMessage({ type: 'user_left', username });
    }
  }
}
