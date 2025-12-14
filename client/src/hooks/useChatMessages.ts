// client/src/hooks/useChatMessages.ts

import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';
import { createMessage } from '../utils/messageUtils';

// Store messages per friend to avoid losing them when switching chats
type MessageStore = Map<string, ChatMessage[]>;
type UnreadCounts = Map<string, number>;

export const useChatMessages = () => {
  const [messageStore, setMessageStore] = useState<MessageStore>(new Map());
  const [currentFriend, setCurrentFriend] = useState<string | null>(null);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>(new Map());

  // Get messages for the current friend
  const messages = currentFriend ? (messageStore.get(currentFriend) || []) : [];

  const addMessage = useCallback(
    (
      type: ChatMessage['type'],
      text: string,
      username?: string,
      friendUsername?: string,
      messageId?: string  // Add messageId to track unique messages
    ): void => {
      const newMessage = createMessage(type, text, username);
      if (messageId) {
        newMessage.id = messageId;
      }
      
      // System messages don't need a friend - skip them
      if (type === 'system') {
        console.log('ℹ️ System message, skipping storage:', text.substring(0, 30));
        return;
      }
      
      // Determine which friend this message is for
      let targetFriend = friendUsername;
      if (!targetFriend && username) {
        // Extract friend username from "From X" or "To X" format
        const match = username.match(/(?:From|To)\s+(.+)/);
        if (match) {
          targetFriend = match[1];
        }
      }
      
      if (!targetFriend) {
        console.warn('⚠️ Cannot determine friend for message:', text.substring(0, 20));
        return;
      }
      
      // Add message to the specific friend's message list
      let messageAdded = false;
      setMessageStore(prev => {
        const friendMessages = prev.get(targetFriend!) || [];
        
        // Check for duplicate by ID first (most reliable)
        if (messageId) {
          const duplicateById = friendMessages.find(msg => msg.id === messageId);
          if (duplicateById) {
            console.log('🚫 Duplicate message by ID detected, skipping:', messageId);
            return prev;
          }
        }
        
        // Fallback: Check for duplicate by text and timestamp (for real-time messages without ID yet)
        const now = Date.now();
        const recentDuplicate = friendMessages.find(msg => 
          msg.text === text && 
          msg.type === type &&
          (now - msg.timestamp.getTime()) < 3000 // Within 3 seconds
        );
        
        if (recentDuplicate) {
          console.log('🚫 Duplicate message by text detected, skipping:', text.substring(0, 20));
          return prev;
        }
        
        messageAdded = true;
        const newMap = new Map(prev);
        newMap.set(targetFriend!, [...friendMessages, newMessage]);
        console.log(`✅ Message added for ${targetFriend}. Total messages: ${friendMessages.length + 1}`);
        return newMap;
      });
      
      // Increment unread count ONLY if message was actually added and not currently viewing that friend
      if (messageAdded && type === 'private_received' && targetFriend !== currentFriend) {
        setUnreadCounts(prev => {
          const newCounts = new Map(prev);
          const currentCount = newCounts.get(targetFriend!) || 0;
          newCounts.set(targetFriend!, currentCount + 1);
          console.log(`📬 Unread count for ${targetFriend}: ${currentCount + 1}`);
          return newCounts;
        });
      }
    },
    [currentFriend]
  );

  const loadHistory = useCallback((historyMessages: ChatMessage[], friendUsername: string) => {
    console.log(`📚 Loading history for ${friendUsername}: ${historyMessages.length} messages from DB`);
    
    // Replace existing messages with history (history is authoritative source of truth)
    setMessageStore(prev => {
      const newMap = new Map(prev);
      newMap.set(friendUsername, historyMessages);
      console.log(`📚 Set ${historyMessages.length} messages for ${friendUsername}`);
      return newMap;
    });
    
    setCurrentFriend(friendUsername);
    
    // Clear unread count for this friend when viewing their chat
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      newCounts.delete(friendUsername);
      return newCounts;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessageStore(new Map());
    setCurrentFriend(null);
    setUnreadCounts(new Map());
  }, []);
  
  const switchToFriend = useCallback((friendUsername: string) => {
    setCurrentFriend(friendUsername);
    
    // Clear unread count when switching to a friend
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      newCounts.delete(friendUsername);
      return newCounts;
    });
  }, []);
  
  const getUnreadCount = useCallback((friendUsername: string): number => {
    return unreadCounts.get(friendUsername) || 0;
  }, [unreadCounts]);

  return {
    messages,
    addMessage,
    loadHistory,
    clearMessages,
    switchToFriend,
    getUnreadCount,
    unreadCounts,
  };
};
