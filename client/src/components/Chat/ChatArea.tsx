// client/src/components/Chat/ChatArea.tsx

import React from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ChatMessage, ChatTarget } from '../../types';

interface ChatAreaProps {
  chatTarget: ChatTarget;
  messages: ChatMessage[];
  username: string;
  roomUsers: string[];
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  chatTarget,
  messages,
  username,
  roomUsers,
  input,
  onInputChange,
  onSendMessage,
  onKeyPress,
}) => {
  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <ChatHeader 
        chatTarget={chatTarget}
        roomUsers={roomUsers}
      />
      
      <MessageList 
        messages={messages}
        username={username}
      />
      
      <MessageInput
        chatTarget={chatTarget}
        input={input}
        onInputChange={onInputChange}
        onSendMessage={onSendMessage}
        onKeyPress={onKeyPress}
      />
    </div>
  );
};
