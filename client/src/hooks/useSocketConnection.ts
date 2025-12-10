// client/src/hooks/useSocketConnection.ts

import { useRef, useCallback } from 'react';
import { SocketService } from '../services/SocketService';
import { ChatService } from '../services/ChatService';

export const useSocketConnection = () => {
  const socketServiceRef = useRef<SocketService>(new SocketService());
  const chatServiceRef = useRef<ChatService>(new ChatService(socketServiceRef.current));

  const connect = useCallback(() => {
    return socketServiceRef.current.connect();
  }, []);

  const disconnect = useCallback(() => {
    socketServiceRef.current.disconnect();
  }, []);

  return {
    socketService: socketServiceRef.current,
    chatService: chatServiceRef.current,
    connect,
    disconnect,
  };
};
