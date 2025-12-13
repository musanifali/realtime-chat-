// client/src/components/Chat/ChatArea.tsx

import React from 'react';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { ComicExplosion } from '../ComicEffects/ComicExplosion';
import { useComicExplosion } from '../../hooks/useComicExplosion';
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
}) => {
  const { explosions, triggerExplosion } = useComicExplosion();

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
      
      <MessageInput
        chatTarget={chatTarget}
        input={input}
        onInputChange={onInputChange}
        onSendMessage={handleSendMessage}
        onKeyPress={handleKeyPress}
      />

      {explosions.map((explosion) => (
        <ComicExplosion key={explosion.id} text={explosion.text} />
      ))}
    </div>
  );
};
