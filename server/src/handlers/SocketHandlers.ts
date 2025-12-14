// server/src/handlers/SocketHandlers.ts

import { Socket } from 'socket.io';
import { RedisService } from '../services/RedisService.js';
import { PubSubService } from '../services/PubSubService.js';
import { BroadcastService } from '../services/BroadcastService.js';
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
  }



  async handlePrivateMessage(socket: SocketType, data: { to: string; message: string }): Promise<void> {
    const username = socket.data.username;
    const userId = socket.data.userId;
    if (!username || !userId) return;

    if (!(await this.redisService.isUsernameTaken(data.to))) {
      socket.emit('error', `User "${data.to}" is not online`);
      return;
    }

    // Check if users are friends before allowing message
    const { Friendship } = await import('../models/Friendship.js');
    
    // Get recipient's userId from Redis or database
    const recipientUsername = data.to;
    const { User } = await import('../models/User.js');
    const recipient = await User.findOne({ username: recipientUsername });
    
    if (!recipient) {
      socket.emit('error', `User "${data.to}" not found`);
      return;
    }

    const areFriends = await Friendship.areFriends(userId, recipient._id.toString());
    
    if (!areFriends) {
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

    await this.pubSubService.publishMessage({
      type: 'private_message',
      from: username,
      to: data.to,
      message: data.message
    });

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
