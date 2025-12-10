// client/src/utils/messageFilter.ts

import { ChatMessage, ChatTarget } from '../types';

export const filterMessagesForTarget = (
  messages: ChatMessage[],
  chatTarget: ChatTarget,
  username: string
): ChatMessage[] => {
  return messages.filter(msg => {
    if (chatTarget.type === 'room') {
      return msg.room === chatTarget.room || (msg.type === 'system' && !msg.room);
    } else {
      if (msg.type === 'private_sent' || msg.type === 'private_received') {
        const otherUser = msg.username?.replace('To ', '').replace('From ', '');
        return otherUser === chatTarget.username;
      }
      return msg.type === 'system' && !msg.room;
    }
  });
};
