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
    const users = await this.redisService.getAllUsers();
    this.io.emit('user_list', users);
  }
}
