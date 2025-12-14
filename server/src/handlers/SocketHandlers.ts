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

    if (await this.redisService.isUsernameTaken(username)) {
      socket.emit('error', `Username "${username}" is already taken`);
      socket.disconnect();
      return;
    }

    socket.data.username = username;
    await this.redisService.addUser(username);

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
      await this.pubSubService.publishMessage({ type: 'user_left', username });
    }
  }
}
