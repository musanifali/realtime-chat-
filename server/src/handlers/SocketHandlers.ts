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

    // Auto-join #general
    socket.join('general');
    socket.data.rooms.add('general');
    await this.redisService.addUserToRoom('general', username);

    // Send initial data
    const rooms = await this.redisService.getAllRooms();
    socket.emit('room_list', rooms);
    socket.emit('joined_room', 'general');

    await this.pubSubService.publishMessage({ type: 'user_joined', username });
    await this.pubSubService.publishMessage({ type: 'user_joined_room', room: 'general', username });

    console.log(`${SERVER_ID}: ${username} registered and joined #general`);
  }

  async handleCreateRoom(socket: SocketType, room: string): Promise<void> {
    const username = socket.data.username;
    if (!username) return;

    // Validate room name
    const roomName = room.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!roomName || roomName.length < 2) {
      socket.emit('error', 'Invalid room name (use letters, numbers, dashes)');
      return;
    }

    if (await this.redisService.roomExists(roomName)) {
      socket.emit('error', `Room #${roomName} already exists`);
      return;
    }

    await this.redisService.addRoom(roomName);
    await this.pubSubService.publishMessage({ type: 'room_created', room: roomName, creator: username });

    console.log(`${SERVER_ID}: ${username} created room #${roomName}`);
  }

  async handleJoinRoom(socket: SocketType, room: string): Promise<void> {
    const username = socket.data.username;
    if (!username) return;

    if (!(await this.redisService.roomExists(room))) {
      socket.emit('error', `Room #${room} doesn't exist`);
      return;
    }

    if (socket.data.rooms.has(room)) {
      socket.emit('error', `You're already in #${room}`);
      return;
    }

    socket.join(room);
    socket.data.rooms.add(room);
    await this.redisService.addUserToRoom(room, username);

    socket.emit('joined_room', room);
    await this.pubSubService.publishMessage({ type: 'user_joined_room', room, username });

    console.log(`${SERVER_ID}: ${username} joined #${room}`);
  }

  async handleLeaveRoom(socket: SocketType, room: string): Promise<void> {
    const username = socket.data.username;
    if (!username) return;

    if (room === 'general') {
      socket.emit('error', "You can't leave #general");
      return;
    }

    if (!socket.data.rooms.has(room)) {
      socket.emit('error', `You're not in #${room}`);
      return;
    }

    socket.leave(room);
    socket.data.rooms.delete(room);
    await this.redisService.removeUserFromRoom(room, username);

    socket.emit('left_room', room);
    await this.pubSubService.publishMessage({ type: 'user_left_room', room, username });

    console.log(`${SERVER_ID}: ${username} left #${room}`);
  }

  async handleRoomMessage(socket: SocketType, data: { room: string; message: string }): Promise<void> {
    const username = socket.data.username;
    if (!username) return;

    if (!socket.data.rooms.has(data.room)) {
      socket.emit('error', `You're not in #${data.room}`);
      return;
    }

    await this.pubSubService.publishMessage({
      type: 'room_message',
      room: data.room,
      username,
      message: data.message
    });

    console.log(`${SERVER_ID}: ${username} → #${data.room}: ${data.message}`);
  }

  async handlePrivateMessage(socket: SocketType, data: { to: string; message: string }): Promise<void> {
    const username = socket.data.username;
    if (!username) return;

    if (!(await this.redisService.isUsernameTaken(data.to))) {
      socket.emit('error', `User "${data.to}" is not online`);
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

  async handleGetRoomUsers(socket: SocketType, room: string): Promise<void> {
    const users = await this.redisService.getRoomMembers(room);
    socket.emit('room_users', { room, users });
  }

  async handleTypingStart(socket: SocketType, room: string): Promise<void> {
    const username = socket.data.username;
    if (!username || !socket.data.rooms.has(room)) return;

    // Broadcast to room members except sender
    socket.to(room).emit('typing_start', { username, room });
  }

  async handleTypingStop(socket: SocketType, room: string): Promise<void> {
    const username = socket.data.username;
    if (!username || !socket.data.rooms.has(room)) return;

    // Broadcast to room members except sender
    socket.to(room).emit('typing_stop', { username, room });
  }

  async handleDisconnect(socket: SocketType): Promise<void> {
    const username = socket.data.username;
    console.log(`${SERVER_ID}: Disconnect - ${username || socket.id}`);

    if (username) {
      // Remove from all rooms
      for (const room of socket.data.rooms) {
        await this.redisService.removeUserFromRoom(room, username);
        await this.pubSubService.publishMessage({ type: 'user_left_room', room, username });
      }

      await this.redisService.removeUser(username);
      await this.pubSubService.publishMessage({ type: 'user_left', username });
    }
  }
}
