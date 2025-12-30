// server/src/services/BroadcastService.ts

import { Server } from 'socket.io';
import { RedisService } from './RedisService.js';
import { ServerToClientEvents, ClientToServerEvents, InterServerEvents, SocketData } from '../types/index.js';

export class BroadcastService {
  constructor(
    private redisService: RedisService,
    private io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>
  ) {}

  async broadcastUserList(): Promise<void> {
    try {
      const users = await this.redisService.getAllUsers();
      this.io.emit('user_list', users);
    } catch (error: any) {
      console.warn('⚠️  Failed to broadcast user list (Redis not connected):', error.message);
      // In single-server mode without Redis, broadcast empty list or local users
      this.io.emit('user_list', []);
    }
  }
}
