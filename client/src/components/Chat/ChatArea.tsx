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
import { VoiceEffect } from '../VoiceRecorder/VoiceRecorder';

interface ChatAreaProps {
  chatTarget: ChatTarget | null;
  messages: ChatMessage[];
  username: string;
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onSendVoice?: (audioBlob: Blob, duration: number, effect?: VoiceEffect) => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  socketService: SocketService | null;
}

const explosionTexts = ['KAPOW!', 'BAM!', 'ZAP!', 'BOOM!', 'POW!', 'WHAM!'];

export const ChatArea: React.FC<ChatAreaProps> = ({
  chatTarget,
  messages,
  username,
  input,
  onInputChange,
  onSendMessage,
  onSendVoice,
  onKeyPress,
  socketService,
}) => {
  const { explosions, triggerExplosion } = useComicExplosion();
  const currentUser = chatTarget?.username || null;
  const { isTyping, notifyTyping } = useTypingIndicator(socketService, currentUser);

  const handleInputChange = (value: string) => {
    onInputChange(value);
    if (value.trim() && chatTarget) {
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

  const handleSendVoice = (audioBlob: Blob, duration: number, effect?: VoiceEffect) => {
    if (onSendVoice) {
      const randomText = explosionTexts[Math.floor(Math.random() * explosionTexts.length)];
      triggerExplosion(randomText);
      onSendVoice(audioBlob, duration, effect);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      const randomText = explosionTexts[Math.floor(Math.random() * explosionTexts.length)];
      triggerExplosion(randomText);
    }
    onKeyPress(e);
  };

  if (!chatTarget) {
    return (
      <div className="flex flex-col h-full items-center justify-center halftone-bg px-4" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center p-4 md:p-8">
          <h2 className="text-3xl md:text-4xl font-black uppercase mb-4" style={{ color: 'var(--color-primary)', textShadow: '3px 3px 0 var(--color-border)' }}>
            💬 SELECT A HERO!
          </h2>
          <p className="text-base md:text-lg font-bold" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="hidden sm:inline">Choose someone from the list to start chatting! 💥</span>
            <span className="sm:hidden">Tap the menu to select! 💥</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <ChatHeader 
        chatTarget={chatTarget}
      />
      
      <MessageList 
        messages={messages}
        username={username}
      />
      
      {isTyping && (
        <TypingIndicator username={chatTarget.username} />
      )}
      
      <MessageInput
        chatTarget={chatTarget}
        input={input}
        onInputChange={handleInputChange}
        onSendMessage={handleSendMessage}
        onSendVoice={handleSendVoice}
        onKeyPress={handleKeyPress}
      />

      {explosions.map((explosion) => (
        <ComicExplosion key={explosion.id} text={explosion.text} />
      ))}
    </div>
  );
};
