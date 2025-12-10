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
      room?: string,
      username?: string
    ): void => {
      const newMessage = createMessage(type, text, room, username);
      setMessages(prev => [...prev, newMessage]);
    },
    []
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    addMessage,
    clearMessages,
  };
};
