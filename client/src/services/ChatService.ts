// client/src/services/ChatService.ts

import { SocketService } from './SocketService';

export class ChatService {
  constructor(private socketService: SocketService) {}

  sendRoomMessage(room: string, message: string): void {
    this.socketService.emit('room_message', { room, message });
  }

  sendPrivateMessage(to: string, message: string): void {
    this.socketService.emit('private_message', { to, message });
  }

  joinRoom(room: string): void {
    this.socketService.emit('join_room', room);
  }

  leaveRoom(room: string): void {
    this.socketService.emit('leave_room', room);
  }

  createRoom(room: string): void {
    this.socketService.emit('create_room', room);
  }

  getRoomUsers(room: string): void {
    this.socketService.emit('get_room_users', room);
  }

  register(username: string): void {
    this.socketService.emit('register', username);
  }
}
