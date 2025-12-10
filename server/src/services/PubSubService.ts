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
        case 'room_message':
          this.handleRoomMessage(data);
          break;
        case 'private_message':
          this.handlePrivateMessage(data);
          break;
        case 'user_joined':
          this.handleUserJoined(data);
          break;
        case 'user_left':
          this.handleUserLeft(data);
          break;
        case 'room_created':
          this.handleRoomCreated(data);
          break;
        case 'user_joined_room':
          this.handleUserJoinedRoom(data);
          break;
        case 'user_left_room':
          this.handleUserLeftRoom(data);
          break;
      }
    } catch (error) {
      console.error(`${SERVER_ID}: Error handling Redis message:`, error);
    }
  }

  private handleRoomMessage(data: Extract<RedisMessage, { type: 'room_message' }>): void {
    this.io.to(data.room).emit('room_message', {
      room: data.room,
      username: data.username,
      message: data.message
    });
  }

  private handlePrivateMessage(data: Extract<RedisMessage, { type: 'private_message' }>): void {
    const sockets = this.io.sockets.sockets;
    sockets.forEach((socket) => {
      if (socket.data.username === data.to || socket.data.username === data.from) {
        socket.emit('private_message', {
          from: data.from,
          to: data.to,
          message: data.message
        });
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

  private handleRoomCreated(data: Extract<RedisMessage, { type: 'room_created' }>): void {
    this.io.emit('system', `Room #${data.room} created by ${data.creator}`);
    this.broadcastService.broadcastRoomList();
  }

  private handleUserJoinedRoom(data: Extract<RedisMessage, { type: 'user_joined_room' }>): void {
    this.io.to(data.room).emit('room_system', {
      room: data.room,
      message: `${data.username} joined #${data.room}`
    });
    this.broadcastService.broadcastRoomUsers(data.room);
  }

  private handleUserLeftRoom(data: Extract<RedisMessage, { type: 'user_left_room' }>): void {
    this.io.to(data.room).emit('room_system', {
      room: data.room,
      message: `${data.username} left #${data.room}`
    });
    this.broadcastService.broadcastRoomUsers(data.room);
  }
}
