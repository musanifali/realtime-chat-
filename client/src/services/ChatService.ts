// client/src/services/ChatService.ts

import { SocketService } from './SocketService';

export class ChatService {
  constructor(private socketService: SocketService) {}

  sendPrivateMessage(to: string, message: string): void {
    this.socketService.emit('private_message', { to, message });
  }

  register(username: string): void {
    this.socketService.emit('register', username);
  }
}
