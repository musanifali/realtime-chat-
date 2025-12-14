// client/src/components/Chat/ChatArea.tsx

import React, { useEffect, useState } from 'react';
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
import { messageService } from '../../services/messageService';

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
  onLoadHistory?: (messages: ChatMessage[], friendUsername: string) => void;
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
  onLoadHistory,
}) => {
  const { explosions, triggerExplosion } = useComicExplosion();
  const currentUser = chatTarget?.username || null;
  const { isTyping, notifyTyping, stopTyping } = useTypingIndicator(socketService, currentUser);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load message history when chat target changes
  useEffect(() => {
    if (!chatTarget || !onLoadHistory) return;

    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        console.log('📚 Loading history for:', chatTarget.username);
        const data = await messageService.getHistory(chatTarget.username);
        
        // Check if data and messages exist before mapping
        if (!data || !data.messages || !Array.isArray(data.messages)) {
          console.warn('No message history available');
          onLoadHistory([], chatTarget.username);
          return;
        }
        
        // Convert DB messages to ChatMessage format with proper IDs
        const historyMessages: ChatMessage[] = data.messages.map((msg) => ({
          id: msg.id.toString(),  // Ensure ID is string
          type: msg.sender.username === username ? 'private_sent' : 'private_received',
          username: msg.sender.username === username ? `To ${msg.recipient.username}` : `From ${msg.sender.username}`,
          text: msg.message,
          timestamp: new Date(msg.createdAt),
        }));

        console.log(`📚 Loaded ${historyMessages.length} messages from history for ${chatTarget.username}`);
        onLoadHistory(historyMessages, chatTarget.username);

        // Mark messages as read
        try {
          await messageService.markAsRead(chatTarget.username);
          console.log(`✅ Marked messages from ${chatTarget.username} as read`);
        } catch (error) {
          console.error('Failed to mark messages as read:', error);
        }
      } catch (error) {
        console.error('Failed to load message history:', error);
        // Don't break the app if history fails - just continue without history
        onLoadHistory([], chatTarget.username);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [chatTarget?.username, username, onLoadHistory]);

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
      stopTyping(); // Stop typing indicator when sending message
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
      stopTyping(); // Stop typing indicator when sending message
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
