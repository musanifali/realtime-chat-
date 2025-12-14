// client/src/hooks/useChatMessages.ts

import { useState, useCallback } from 'react';
import { ChatMessage } from '../types';
import { createMessage } from '../utils/messageUtils';

export const useChatMessages = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const addMessage = useCallback(
    (
      type: ChatMessage['type'],
      text: string,
      username?: string
    ): void => {
      const newMessage = createMessage(type, text, username);
      setMessages(prev => [...prev, newMessage]);
    },
    []
  );

  const loadHistory = useCallback((historyMessages: ChatMessage[]) => {
    // Replace messages with history (for when switching friends)
    setMessages(historyMessages);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    loadHistory,
    clearMessages,
  };
};
