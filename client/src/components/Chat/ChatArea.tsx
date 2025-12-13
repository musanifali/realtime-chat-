// client/src/components/Chat/ChatArea.tsx

import React from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { TypingIndicator } from './TypingIndicator';
import { ComicExplosion } from '../ComicEffects/ComicExplosion';
import { useComicExplosion } from '../../hooks/useComicExplosion';
import { useTypingIndicator } from '../../hooks/useTypingIndicator';
import { ChatMessage, ChatTarget } from '../../types';
import { SocketService } from '../../services/SocketService';

interface ChatAreaProps {
  chatTarget: ChatTarget;
  messages: ChatMessage[];
  username: string;
  roomUsers: string[];
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  socketService: SocketService | null;
}

const explosionTexts = ['KAPOW!', 'BAM!', 'ZAP!', 'BOOM!', 'POW!', 'WHAM!'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  chatTarget,
  messages,
  username,
  roomUsers,
  input,
  onInputChange,
  onSendMessage,
  onKeyPress,
  socketService,
}) => {
  const { explosions, triggerExplosion } = useComicExplosion();
  const currentRoom = chatTarget.type === 'room' ? chatTarget.room : null;
  const { typingUsers, notifyTyping } = useTypingIndicator(socketService, currentRoom);

  const handleInputChange = (value: string) => {
    onInputChange(value);
    if (value.trim() && chatTarget.type === 'room') {
      notifyTyping();
    }
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      const randomText = explosionTexts[Math.floor(Math.random() * explosionTexts.length)];
      triggerExplosion(randomText);
      onSendMessage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      const randomText = explosionTexts[Math.floor(Math.random() * explosionTexts.length)];
      triggerExplosion(randomText);
    }
    onKeyPress(e);
  };

  // Filter out current user from typing users
  const displayTypingUsers = typingUsers.filter(user => user !== username);

  return (
    <div className="flex flex-col h-full relative" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <ChatHeader 
        chatTarget={chatTarget}
        roomUsers={roomUsers}
      />
      
      <MessageList 
        messages={messages}
        username={username}
      />
      
      {chatTarget.type === 'room' && displayTypingUsers.length > 0 && (
        <TypingIndicator usernames={displayTypingUsers} />
      )}
      
      <MessageInput
        chatTarget={chatTarget}
        input={input}
        onInputChange={handleInputChange}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
      />

      {explosions.map((explosion) => (
        <ComicExplosion key={explosion.id} text={explosion.text} />
      ))}
    </div>
  );
};
