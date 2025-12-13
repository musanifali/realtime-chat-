// client/src/hooks/useChatApp.ts

import { useState, useCallback } from 'react';
import { useSocketConnection } from './useSocketConnection';
import { useChatMessages } from './useChatMessages';
import { useUserManagement } from './useUserManagement';
import { ChatTarget } from '../types';

export const useChatApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [username, setUsername] = useState('');
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);

  const { socketService, chatService, connect: connectSocket, disconnect: disconnectSocket } = useSocketConnection();
  const { messages, addMessage } = useChatMessages();
  const { allUsers, updateUserList, clearUsers } = useUserManagement();

  // Setup socket event handlers
  const setupSocketHandlers = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Connected
    socket.on('connect', () => {
      console.log('Connected to server!');
      chatService.register(username.trim());
    });

    // User list
    socket.on('user_list', (users) => {
      updateUserList(users, username);
      if (!isConnected) {
        setIsConnected(true);
        setIsConnecting(false);
      }
    });

    // Private message
    socket.on('private_message', (data) => {
      const isMine = data.from === username;
      addMessage(
        isMine ? 'private_sent' : 'private_received',
        data.message,
        isMine ? `To ${data.to}` : `From ${data.from}`
      );
    });

    // System message
    socket.on('system', (message) => {
      addMessage('system', message);
    });

    // Error
    socket.on('error', (message) => {
      if (message.includes('already taken')) {
        setConnectionError(message);
        setIsConnecting(false);
        socket.disconnect();
      } else {
        addMessage('system', `⚠️ ${message}`);
      }
    });

    // Disconnected
    socket.on('disconnect', () => {
      if (isConnected) {
        addMessage('system', 'Disconnected from server');
      }
      setIsConnected(false);
      setIsConnecting(false);
      clearUsers();
    });

    // Connection error
    socket.on('connect_error', () => {
      setConnectionError('Could not connect to server');
      setIsConnecting(false);
    });
  }, [
    socketService,
    chatService,
    username,
    isConnected,
    addMessage,
    updateUserList,
    clearUsers,
  ]);

  // Connect
  const connect = useCallback(() => {
    if (!username.trim()) {
      setConnectionError('Please enter a username');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');
    const socket = connectSocket();
    
    // Setup handlers immediately after connecting
    if (socket) {
      setupSocketHandlers();
    }
  }, [username, connectSocket, setupSocketHandlers]);

  // Disconnect
  const disconnect = useCallback(() => {
    disconnectSocket();
  }, [disconnectSocket]);



  return {
    // Connection state
    isConnected,
    isConnecting,
    connectionError,
    username,
    setUsername,
    connect,
    disconnect,
    
    // Chat state
    messages,
    chatTarget,
    setChatTarget,
    
    // User state
    allUsers,
    
    // Actions
    chatService,
    socketService,
  };
};
