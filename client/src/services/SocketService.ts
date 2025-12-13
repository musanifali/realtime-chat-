// client/src/services/SocketService.ts

import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../types';
import { SERVER_URL, SOCKET_CONFIG } from '../config/constants';

export class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    this.socket = io(SERVER_URL, SOCKET_CONFIG);
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (this.socket) {
      this.socket.emit(event, ...args);
    }
  }

  on<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerToClientEvents[K]
  ): void {
    if (this.socket) {
      this.socket.on(event, handler as any);
    }
  }

  off<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerToClientEvents[K]
  ): void {
    if (this.socket) {
      this.socket.off(event, handler as any);
    }
  }

  // Typing indicator methods
  sendTypingStart(to: string): void {
    this.emit('typing_start', { to });
  }

  sendTypingStop(to: string): void {
    this.emit('typing_stop', { to });
  }

  onTypingStart(handler: (data: { username: string }) => void): void {
    this.on('typing_start', handler);
  }

  onTypingStop(handler: (data: { username: string }) => void): void {
    this.on('typing_stop', handler);
  }
}
