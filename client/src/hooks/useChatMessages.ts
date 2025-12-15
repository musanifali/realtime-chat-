// client/src/hooks/useChatMessages.ts

import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';
import { createMessage } from '../utils/messageUtils';
import { notificationService } from '../services/NotificationService';
import { soundManager } from '../services/SoundManager';

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
      // AND clear unread if currently viewing (message is immediately read)
      if (messageAdded && type === 'private_received') {
        // Always play sound for new messages
        soundManager.playMessage();
        
        if (currentFriend && targetFriend === currentFriend) {
          // Currently viewing this chat - clear unread count immediately
          setUnreadCounts(prev => {
            const newCounts = new Map(prev);
            newCounts.delete(targetFriend!);
            console.log(`👁️ Currently viewing ${targetFriend}, clearing unread badge, NO notification`);
            return newCounts;
          });
          
          // DO NOT show notification when actively viewing this chat
          // User can already see the message in the chatbox
        } else {
          // Not viewing this chat OR not viewing any chat - increment unread
          setUnreadCounts(prev => {
            const newCounts = new Map(prev);
            const currentCount = newCounts.get(targetFriend!) || 0;
            newCounts.set(targetFriend!, currentCount + 1);
            console.log(`📬 Unread count for ${targetFriend}: ${currentCount} -> ${currentCount + 1} (currentFriend: ${currentFriend || 'none'})`);
            return newCounts;
          });

          // Show notification ONLY when not viewing this specific chat
          console.log(`🔔 Not viewing ${targetFriend}, showing notification`);
          notificationService.notifyNewMessage(targetFriend!, text, true);
        }
      }
    },
    [currentFriend]
  );

  const loadHistory = useCallback((historyMessages: ChatMessage[], friendUsername: string) => {
    console.log(`📚 [useChatMessages] loadHistory called for ${friendUsername}: ${historyMessages.length} messages`);
    
    // Set current friend FIRST so subsequent messages know we're viewing this chat
    setCurrentFriend(friendUsername);
    console.log(`📚 [useChatMessages] Set currentFriend to: ${friendUsername}`);
    
    // Only update messages if history has data, otherwise keep existing messages
    setMessageStore(prev => {
      const existingMessages = prev.get(friendUsername) || [];
      console.log(`📚 [useChatMessages] Existing messages in store for ${friendUsername}: ${existingMessages.length}`);
      console.log(`📚 [useChatMessages] New history messages: ${historyMessages.length}`);
      
      const newMap = new Map(prev);
      
      // If history is empty but we have existing messages, keep them (don't delete!)
      if (historyMessages.length === 0 && existingMessages.length > 0) {
        console.log(`⚠️ [useChatMessages] History empty, keeping ${existingMessages.length} existing messages`);
        // Don't change the map, keep existing messages
        return prev;
      }
      
      // If we have history, replace with it (authoritative source)
      newMap.set(friendUsername, historyMessages);
      console.log(`📚 [useChatMessages] Set ${historyMessages.length} messages for ${friendUsername}`);
      if (historyMessages.length > 0) {
        console.log(`📚 [useChatMessages] First message:`, historyMessages[0]);
        console.log(`📚 [useChatMessages] Last message:`, historyMessages[historyMessages.length - 1]);
      }
      return newMap;
    });
    
    // Clear unread count for this friend when viewing their chat
    setUnreadCounts(prev => {
      const currentCount = prev.get(friendUsername) || 0;
      console.log(`🔔 [useChatMessages] Current unread count for ${friendUsername}: ${currentCount}`);
      const newCounts = new Map(prev);
      newCounts.delete(friendUsername);
      console.log(`🔔 [useChatMessages] Cleared unread badge for ${friendUsername}`);
      console.log(`🔔 [useChatMessages] Remaining unread counts:`, Array.from(newCounts.entries()));
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

  // Update message ID after server confirms (replaces temp ID with real DB ID)
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

  return {
    messages,
    addMessage,
    loadHistory,
    clearMessages,
    switchToFriend,
    getUnreadCount,
    unreadCounts,
    updateMessageId,
  };
};
