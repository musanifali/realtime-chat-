// client/src/utils/messageFilter.ts

import { ChatMessage, ChatTarget } from '../types';

export const filterMessagesForTarget = (
  messages: ChatMessage[],
  chatTarget: ChatTarget,
  _username: string
): ChatMessage[] => {
  return messages.filter(msg => {
    if (msg.type === 'system') return true;
    if (msg.type === 'private_sent' || msg.type === 'private_received') {
      const otherUser = msg.username?.replace('To ', '').replace('From ', '');
      return otherUser === chatTarget.username;
    }
    return false;
  });
};
