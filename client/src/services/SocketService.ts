// client/src/services/SocketService.ts

import { io, Socket } from 'socket.io-client';
import { ServerToClientEvents, ClientToServerEvents } from '../types';
import { SERVER_URL, SOCKET_CONFIG } from '../config/constants';
import { authService } from './authService';

export class SocketService {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private messageQueue: Array<{ event: string; args: any[] }> = [];
  private isReady: boolean = false;

  connect(): Socket<ServerToClientEvents, ClientToServerEvents> {
    // If socket already exists and is connected, return it
    if (this.socket && this.socket.connected) {
      console.log('♻️ Socket already connected, reusing existing connection');
      return this.socket;
    }
    
    // Get JWT token for authentication
    const token = authService.getAccessToken();
    
    console.log('🔌 SocketService.connect() called');
    console.log('📝 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    console.log('🌐 Server URL:', SERVER_URL);
    
    // Add auth token to socket connection
    const config = {
      ...SOCKET_CONFIG,
      auth: {
        token: token || '',
      },
    };
    
    this.socket = io(SERVER_URL, config);
    
    // Add connection event listeners IMMEDIATELY
    this.socket.on('connect', () => {
      console.log('✅ Socket connected! ID:', this.socket?.id);
      // Set ready after delay to allow auth/registration
      setTimeout(() => {
        this.isReady = true;
        console.log('🟢 Socket marked as ready');
        this.flushMessageQueue();
      }, 1000);
    });
    
    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
      this.isReady = false;
    });
    
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      this.isReady = false;
    });
    
    // Check if already connected (in case connect event already fired)
    if (this.socket.connected) {
      console.log('✅ Socket already connected on creation, marking ready...');
      setTimeout(() => {
        this.isReady = true;
        console.log('🟢 Socket marked as ready (immediate path)');
        this.flushMessageQueue();
      }, 1000);
    }
    
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      console.log('🔌 Disconnecting socket...');
      // Remove all listeners to ensure clean reconnection
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isReady = false;
    this.messageQueue = [];
  }

  getSocket(): Socket<ServerToClientEvents, ClientToServerEvents> | null {
    return this.socket;
  }

  private flushMessageQueue(): void {
    if (!this.socket || !this.isReady) return;
    
    console.log('📦 Flushing message queue:', this.messageQueue.length, 'messages');
    while (this.messageQueue.length > 0) {
      const { event, args } = this.messageQueue.shift()!;
      console.log('📤 Sending queued event:', event, args);
      this.socket.emit(event as any, ...args);
    }
  }

  emit<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): void {
    if (this.socket && this.isReady) {
      console.log('📤 Emitting event:', event, 'with args:', JSON.stringify(args));
      this.socket.emit(event, ...args);
    } else if (this.socket) {
      // Queue message until socket is ready
      console.log('⏳ Queueing event (socket not ready):', event, 'with args:', JSON.stringify(args));
      this.messageQueue.push({ event: event as string, args });
    } else {
      console.error('❌ Cannot emit - socket not connected! Event:', event);
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

  // Message reaction methods
  sendReaction(messageId: string, emoji: string, to: string): void {
    this.emit('message_reaction', { messageId, emoji, to });
  }

  onReaction(handler: (data: { messageId: string; emoji: string; username: string; action: 'add' | 'remove' }) => void): void {
    this.on('message_reaction', handler);
  }
}

export const socketService = new SocketService();
