// client/src/utils/messageUtils.ts

import { ChatMessage } from '../types';

export const generateMessageId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export const createMessage = (
  type: ChatMessage['type'],
  text: string,
  username?: string
): ChatMessage => {
  return {
    id: generateMessageId(),
    type,
    text,
    username,
    timestamp: new Date(),
  };
};

export const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
