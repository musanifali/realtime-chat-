// client/src/hooks/useChatApp.ts

import { useState, useEffect, useCallback } from 'react';
import { useSocketConnection } from './useSocketConnection';
import { useChatMessages } from './useChatMessages';
import { useRoomManagement } from './useRoomManagement';
import { useUserManagement } from './useUserManagement';
import { ChatTarget } from '../types';
import { DEFAULT_ROOM } from '../config/constants';

export const useChatApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [username, setUsername] = useState('');
  const [chatTarget, setChatTarget] = useState<ChatTarget>({ type: 'room', room: DEFAULT_ROOM });

  const { socketService, chatService, connect: connectSocket, disconnect: disconnectSocket } = useSocketConnection();
  const { messages, addMessage } = useChatMessages();
  const { 
    allRooms, 
    myRooms, 
    updateRoomList, 
    addToMyRooms, 
    removeFromMyRooms, 
    updateRoomUsers,
    getRoomUsers,
    clearRooms 
  } = useRoomManagement();
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

    // Room list
    socket.on('room_list', (rooms) => {
      updateRoomList(rooms);
      if (!isConnected) {
        setIsConnected(true);
        setIsConnecting(false);
      }
    });

    // Joined room
    socket.on('joined_room', (room) => {
      addToMyRooms(room);
      addMessage('system', `You joined #${room}`, room);
    });

    // Left room
    socket.on('left_room', (room) => {
      removeFromMyRooms(room);
      addMessage('system', `You left #${room}`);
      
      if (chatTarget.type === 'room' && chatTarget.room === room) {
        setChatTarget({ type: 'room', room: DEFAULT_ROOM });
      }
    });

    // Room users
    socket.on('room_users', ({ room, users }) => {
      updateRoomUsers(room, users);
    });

    // User list
    socket.on('user_list', (users) => {
      updateUserList(users, username);
    });

    // Room message
    socket.on('room_message', (data) => {
      addMessage('message', data.message, data.room, data.username);
    });

    // Room system message
    socket.on('room_system', ({ room, message }) => {
      addMessage('system', message, room);
    });

    // Private message
    socket.on('private_message', (data) => {
      const isMine = data.from === username;
      addMessage(
        isMine ? 'private_sent' : 'private_received',
        data.message,
        undefined,
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
      clearRooms();
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
    chatTarget,
    addMessage,
    updateRoomList,
    addToMyRooms,
    removeFromMyRooms,
    updateRoomUsers,
    updateUserList,
    clearRooms,
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

  // Request room users when changing rooms
  useEffect(() => {
    if (chatTarget.type === 'room' && isConnected) {
      chatService.getRoomUsers(chatTarget.room);
    }
  }, [chatTarget, isConnected, chatService]);

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
    
    // Room state
    allRooms,
    myRooms,
    getRoomUsers,
    
    // User state
    allUsers,
    
    // Actions
    chatService,
    socketService,
  };
};
