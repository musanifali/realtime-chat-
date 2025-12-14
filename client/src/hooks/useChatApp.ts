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
  const { messages, addMessage, loadHistory, clearMessages, getUnreadCount, unreadCounts } = useChatMessages();
  const { allUsers, updateUserList, clearUsers } = useUserManagement();

  // Setup socket event handlers
  const setupSocketHandlers = useCallback(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    // Check if handlers are already set up
    // @ts-ignore - Add custom flag to track if handlers are set
    if (socket._handlersSetup) {
      console.log('📋 Socket handlers already set up, skipping...');
      return;
    }

    console.log('📋 Setting up socket handlers...');

    // Connected
    socket.on('connect', async () => {
      console.log('✅ Connected to server!');
      setIsConnected(true);
      setIsConnecting(false);
      // With JWT auth, user is auto-registered on server
      // No need to call register explicitly
      
      // Fetch all pending messages from friends when connecting
      // Only fetch if this is a fresh connection (not already fetched)
      // @ts-ignore
      if (socket._pendingMessagesFetched) {
        console.log('📥 Pending messages already fetched, skipping...');
        return;
      }
      
      console.log('📥 Fetching pending messages...');
      try {
        const { messageService } = await import('../services/messageService');
        const { authService } = await import('../services/authService');
        
        // Get current user from auth service (not from stale closure)
        const currentUser = await authService.getMe();
        const currentUsername = currentUser.username;
        console.log('👤 Current user:', currentUsername);
        
        const pendingMessages = await messageService.getPendingMessages();
        console.log(`📥 Found ${pendingMessages.length} pending messages`);
        
        // Mark as fetched to prevent duplicate fetching
        // @ts-ignore
        socket._pendingMessagesFetched = true;
        
        // Group messages by friend and add them with message IDs
        pendingMessages.forEach((msg) => {
          const isMine = msg.sender.username === currentUsername;
          const friendUsername = isMine ? msg.recipient.username : msg.sender.username;
          
          console.log(`📬 Processing pending message ID ${msg.id}: from=${msg.sender.username}, to=${msg.recipient.username}, isMine=${isMine}, friendUsername=${friendUsername}`);
          
          addMessage(
            isMine ? 'private_sent' : 'private_received',
            msg.message,
            isMine ? `To ${msg.recipient.username}` : `From ${msg.sender.username}`,
            friendUsername,
            msg.id  // Pass message ID to prevent duplicates
          );
        });
        
        console.log('✅ Pending messages processed successfully');
      } catch (error) {
        console.error('❌ Error fetching pending messages:', error);
      }
    });

    // User list
    socket.on('user_list', (users) => {
      console.log('👥 User list received:', users);
      updateUserList(users, username);
    });

    // Private message - handle messages even when not viewing that friend's chat
    // This is the KEY FIX: messages are received and stored regardless of current chat view
    socket.on('private_message', (data) => {
      console.log('📨 Received private message:', data);
      const isMine = data.from === username;
      const friendUsername = isMine ? data.to : data.from;
      
      addMessage(
        isMine ? 'private_sent' : 'private_received',
        data.message,
        isMine ? `To ${data.to}` : `From ${data.from}`,
        friendUsername  // Pass friend username to store message correctly
      );
      
      // Log for debugging
      console.log(`💬 Message stored for friend: ${friendUsername} (current view: ${chatTarget?.username || 'none'})`);
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
      console.log('🔌 Disconnected from server');
      if (isConnected) {
        addMessage('system', 'Disconnected from server');
      }
      setIsConnected(false);
      setIsConnecting(false);
      clearUsers();
    });

    // Connection error
    socket.on('connect_error', (error) => {
      console.log('❌ Connection error:', error);
      setConnectionError('Could not connect to server');
      setIsConnecting(false);
    });

    // Mark handlers as set up
    // @ts-ignore
    socket._handlersSetup = true;
    console.log('✅ Socket handlers set up complete');
  }, [
    socketService,
    username,
    isConnected,
    addMessage,
    updateUserList,
    clearUsers,
    chatTarget,
  ]);

  // Connect
  const connect = useCallback(() => {
    // For JWT auth, username is already validated
    // Just connect and let server handle authentication
    console.log('🔌 Connecting socket with username:', username);

    setIsConnecting(true);
    setConnectionError('');
    
    // First connect to create the socket
    const socket = connectSocket();
    
    // Then setup handlers (will only set up once due to flag check)
    setupSocketHandlers();
  }, [username, connectSocket, setupSocketHandlers]);

  // Disconnect
  const disconnect = useCallback(() => {
    const socket = socketService.getSocket();
    if (socket) {
      // Clear the handlers setup flag so they can be set up again on reconnect
      // @ts-ignore
      delete socket._handlersSetup;
      // Clear the pending messages fetched flag
      // @ts-ignore
      delete socket._pendingMessagesFetched;
    }
    disconnectSocket();
  }, [disconnectSocket, socketService]);



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
    addMessage,
    chatTarget,
    setChatTarget,
    loadHistory,
    clearMessages,
    getUnreadCount,
    unreadCounts,
    
    // User state
    allUsers,
    
    // Actions
    chatService,
    socketService,
  };
};
