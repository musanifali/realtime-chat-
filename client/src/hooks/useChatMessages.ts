// client/src/hooks/useChatMessages.ts

import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';
import { createMessage } from '../utils/messageUtils';
import { soundManager } from '../services/SoundManager';

// Store messages per friend to avoid losing them when switching chats
type MessageStore = Map<string, ChatMessage[]>;
type UnreadCounts = Map<string, number>;

export const useChatMessages = () => {
  const [messageStore, setMessageStore] = useState<MessageStore>(new Map());
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>(new Map());

  // Get messages for a specific friend
  const getMessagesForFriend = useCallback((friendUsername: string): ChatMessage[] => {
    return messageStore.get(friendUsername) || [];
  }, [messageStore]);

  const addMessage = useCallback(
    (
      type: ChatMessage['type'],
      text: string,
      username?: string,
      friendUsername?: string,
      messageId?: string
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
        
        // Check for duplicate by ID
        if (messageId) {
          const duplicateById = friendMessages.find(msg => msg.id === messageId);
          if (duplicateById) {
            console.log('🚫 Duplicate message by ID detected, skipping:', messageId);
            return prev;
          }
        }
        
        // Check for duplicate by text and timestamp
        const now = Date.now();
        const recentDuplicate = friendMessages.find(msg => 
          msg.text === text && 
          msg.type === type &&
          (now - msg.timestamp.getTime()) < 3000
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
      
      // Play sound and increment unread for received messages
      if (messageAdded && type === 'private_received') {
        soundManager.playReceive();
        setUnreadCounts(prev => {
          const newCounts = new Map(prev);
          const currentCount = newCounts.get(targetFriend!) || 0;
          newCounts.set(targetFriend!, currentCount + 1);
          console.log(`📬 Incremented unread for ${targetFriend}: ${currentCount + 1}`);
          return newCounts;
        });
      }
    },
    []
  );

  const loadHistory = useCallback((historyMessages: ChatMessage[], friendUsername: string) => {
    console.log(`📚 [useChatMessages] loadHistory called for ${friendUsername}: ${historyMessages.length} messages`);
    
    setMessageStore(prev => {
      const existingMessages = prev.get(friendUsername) || [];
      console.log(`📚 [useChatMessages] Existing: ${existingMessages.length}, New history: ${historyMessages.length}`);
      
      const newMap = new Map(prev);
      
      // If history is empty but we have existing messages, keep them
      if (historyMessages.length === 0 && existingMessages.length > 0) {
        console.log(`⚠️ [useChatMessages] History empty, keeping ${existingMessages.length} existing messages`);
        return prev;
      }
      
      // Replace with history (authoritative source)
      newMap.set(friendUsername, historyMessages);
      console.log(`📚 [useChatMessages] Set ${historyMessages.length} messages for ${friendUsername}`);
      return newMap;
    });
    
    // Clear unread count when viewing chat
    setUnreadCounts(prev => {
      const newCounts = new Map(prev);
      newCounts.delete(friendUsername);
      console.log(`🔔 [useChatMessages] Cleared unread badge for ${friendUsername}`);
      return newCounts;
    });
  }, []);

  const clearMessages = useCallback(() => {
    setMessageStore(new Map());
    setUnreadCounts(new Map());
  }, []);
  
  const getUnreadCount = useCallback((friendUsername: string): number => {
    return unreadCounts.get(friendUsername) || 0;
  }, [unreadCounts]);

  const updateMessageId = useCallback((friendUsername: string, tempId: string, realId: string) => {
    setMessageStore(prev => {
      const friendMessages = prev.get(friendUsername);
      if (!friendMessages) return prev;
      
      const updatedMessages = friendMessages.map(msg => 
        msg.id === tempId ? { ...msg, id: realId } : msg
      );
      
      const newMap = new Map(prev);
      newMap.set(friendUsername, updatedMessages);
      return newMap;
    });
  }, []);

  const updateMessageReaction = useCallback((friendUsername: string, messageId: string, emoji: string, username: string, action: 'add' | 'remove') => {
    setMessageStore(prev => {
      const friendMessages = prev.get(friendUsername);
      if (!friendMessages) return prev;
      
      const updatedMessages = friendMessages.map(msg => {
        if (msg.id !== messageId) return msg;
        
        const reactions = msg.reactions || [];
        if (action === 'add') {
          return { ...msg, reactions: [...reactions, { emoji, username }] };
        } else {
          return { ...msg, reactions: reactions.filter(r => !(r.emoji === emoji && r.username === username)) };
        }
      });
      
      const newMap = new Map(prev);
      newMap.set(friendUsername, updatedMessages);
      return newMap;
    });
  }, []);

  return {
    messageStore,
    getMessagesForFriend,
    addMessage,
    loadHistory,
    clearMessages,
    getUnreadCount,
    unreadCounts,
    updateMessageId,
    updateMessageReaction,
  };
};
