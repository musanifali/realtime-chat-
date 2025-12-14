// server/src/services/PubSubService.ts

import { Server } from 'socket.io';
import { RedisService } from './RedisService.js';
import { BroadcastService } from './BroadcastService.js';
import { RedisMessage, ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '../types/index.js';
import { CHANNEL, SERVER_ID } from '../config/constants.js';

export class PubSubService {
  constructor(
    private redisService: RedisService,
    private broadcastService: BroadcastService,
    private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  ) {}

  async publishMessage(data: RedisMessage): Promise<void> {
    await this.redisService.publish(CHANNEL, JSON.stringify(data));
    console.log(`${SERVER_ID}: Published:`, data.type);
  }

  async setupSubscription(): Promise<void> {
    await this.redisService.subscribe(CHANNEL, (rawMessage: string) => {
      this.handleRedisMessage(rawMessage);
    });
    console.log(`${SERVER_ID}: Subscribed to "${CHANNEL}"`);
  }

  private handleRedisMessage(rawMessage: string): void {
    try {
      const data: RedisMessage = JSON.parse(rawMessage);
      console.log(`${SERVER_ID}: Received from Redis:`, data.type);

      switch (data.type) {
        case 'private_message':
          this.handlePrivateMessage(data);
          break;
        case 'typing_start':
          this.handleTypingStart(data);
          break;
        case 'typing_stop':
          this.handleTypingStop(data);
          break;
        case 'user_joined':
          this.handleUserJoined(data);
          break;
        case 'user_left':
          this.handleUserLeft(data);
          break;
        case 'friend_status_changed':
          this.handleFriendStatusChanged(data);
          break;
      }
    } catch (error) {
      console.error(`${SERVER_ID}: Error handling Redis message:`, error);
    }
  }

  private async handlePrivateMessage(data: Extract<RedisMessage, { type: 'private_message' }>): Promise<void> {
    const sockets = this.io.sockets.sockets;
    let recipientFound = false;
    
    // Only send to recipient - sender already has the message from optimistic update
    for (const socket of sockets.values()) {
      if (socket.data.username === data.to) {
        recipientFound = true;
        socket.emit('private_message', {
          from: data.from,
          to: data.to,
          message: data.message,
          messageId: data.messageId
        });
        console.log(`${SERVER_ID}: ✅ Delivered message to ${data.to}`);
        
        // Mark as delivered in DB
        if (data.messageId) {
          try {
            const { Message } = await import('../models/Message.js');
            await Message.findByIdAndUpdate(data.messageId, {
              isDelivered: true,
              deliveredAt: new Date()
            });
            console.log(`${SERVER_ID}: 📬 Message ${data.messageId} marked as delivered`);
          } catch (error) {
            console.error(`${SERVER_ID}: ❌ Failed to mark message as delivered:`, error);
          }
        }
        break;
      }
    }
    
    // Log if recipient is offline (message queued in DB for later delivery)
    if (!recipientFound) {
      console.log(`${SERVER_ID}: 📪 Recipient "${data.to}" offline - message saved to DB, will deliver on reconnect`);
    }
  }

  private handleTypingStart(data: Extract<RedisMessage, { type: 'typing_start' }>): void {
    const sockets = this.io.sockets.sockets;
    sockets.forEach((socket) => {
      if (socket.data.username === data.to) {
        socket.emit('typing_start', { username: data.from });
      }
    });
  }

  private handleTypingStop(data: Extract<RedisMessage, { type: 'typing_stop' }>): void {
    const sockets = this.io.sockets.sockets;
    sockets.forEach((socket) => {
      if (socket.data.username === data.to) {
        socket.emit('typing_stop', { username: data.from });
      }
    });
  }

  private handleUserJoined(data: Extract<RedisMessage, { type: 'user_joined' }>): void {
    this.io.emit('system', `${data.username} joined the chat`);
    this.broadcastService.broadcastUserList();
  }

  private handleUserLeft(data: Extract<RedisMessage, { type: 'user_left' }>): void {
    this.io.emit('system', `${data.username} left the chat`);
    this.broadcastService.broadcastUserList();
  }

  private handleFriendStatusChanged(data: Extract<RedisMessage, { type: 'friend_status_changed' }>): void {
    // Send status update to specific friend
    const sockets = this.io.sockets.sockets;
    sockets.forEach((socket) => {
      if (socket.data.username === data.to) {
        socket.emit('friend_status_changed', {
          username: data.username,
          status: data.status
        });
      }
    });
  }
}
