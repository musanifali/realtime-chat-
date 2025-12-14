// client/src/hooks/useChatApp.ts

import { useState, useCallback } from 'react';
import { useSocketConnection } from './useSocketConnection';
import { useChatMessages } from './useChatMessages';
import { useUserManagement } from './useUserManagement';
import { ChatTarget } from '../types';
import { messageService } from '../services/messageService';
import { authService } from '../services/authService';

export const useChatApp = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [username, setUsername] = useState('');
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null);

  const { socketService, chatService, connect: connectSocket, disconnect: disconnectSocket } = useSocketConnection();
  const { messages, addMessage, loadHistory, clearMessages, getUnreadCount, unreadCounts, updateMessageId } = useChatMessages();
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
    
    // Remove only application-level listeners to prevent duplicates
    // DON'T remove connect/disconnect/connect_error - SocketService needs these for isReady state!
    socket.removeAllListeners('user_list');
    socket.removeAllListeners('message_sent');
    socket.removeAllListeners('private_message');
    socket.removeAllListeners('system');
    socket.removeAllListeners('error');

    // Connected - add our application handler
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
        // Use already imported services instead of dynamic import
        const currentUser = await authService.getMe();
        const currentUsername = currentUser.username;
        console.log('👤 Current user:', currentUsername);
        
        const { messageService: msgService } = await import('../services/messageService');
        const pendingMessages = await msgService.getPendingMessages();
        console.log(`📥 Received pending messages response:`, pendingMessages);
        
        // Mark as fetched to prevent duplicate fetching
        // @ts-ignore
        socket._pendingMessagesFetched = true;
        
        // Handle if API returns undefined or empty
        if (!pendingMessages || pendingMessages.length === 0) {
          console.log('📭 No pending messages');
          return;
        }
        
        console.log(`📥 Found ${pendingMessages.length} pending messages`);
        
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
      } catch (error: any) {
        console.error('❌ Error fetching pending messages:', error);
        console.error('Error details:', error.message, error.stack);
      }
    });

    // User list
    socket.on('user_list', (users) => {
      console.log('👥 User list received:', users);
      updateUserList(users, username);
    });

    // Message sent acknowledgment - update temp ID with real ID from DB
    socket.on('message_sent', (data) => {
      console.log('✅ Message acknowledged by server:', data);
      console.log(`🔄 Updating message ID: ${data.tempId} -> ${data.messageId} for friend: ${data.to}`);
      // Update the temp ID with the real message ID
      updateMessageId(data.to, data.tempId, data.messageId);
    });

    // Private message - only for RECEIVED messages (not sent by us)
    socket.on('private_message', async (data) => {
      console.log('📨 Received private message:', data);
      const friendUsername = data.from; // Always from the sender
      
      // Add received message with server's messageId for deduplication
      addMessage(
        'private_received',
        data.message,
        `From ${data.from}`,
        friendUsername,
        data.messageId // Use server's message ID to prevent duplicates
      );
      
      console.log(`💬 Message stored for friend: ${friendUsername} (current view: ${chatTarget?.username || 'none'})`);
      
      // If currently viewing this friend's chat, mark as read immediately
      // Note: The addMessage above already handles clearing unread count in useChatMessages
      if (chatTarget?.username === friendUsername) {
        console.log(`👁️ Currently viewing ${friendUsername}, marking as read immediately...`);
        try {
          await messageService.markAsRead(friendUsername);
          console.log(`✅ Marked message from ${friendUsername} as read on server`);
        } catch (error) {
          console.error('Failed to mark message as read:', error);
        }
      }
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
    // Note: chatTarget intentionally NOT included to avoid reconnection on chat switch
  ]);

  // Connect
  const connect = useCallback(() => {
    // For JWT auth, username is already validated
    // Just connect and let server handle authentication
    console.log('🔌 Connecting socket with username:', username);

    setIsConnecting(true);
    setConnectionError('');
    
    // Connect to create the socket (only if not already connected)
    connectSocket();
    
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
    updateMessageId,
    
    // User state
    allUsers,
    
    // Actions
    chatService,
    socketService,
  };
};
