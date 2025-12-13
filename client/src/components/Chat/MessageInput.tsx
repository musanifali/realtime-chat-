// client/src/components/Chat/MessageInput.tsx

import React, { useRef } from 'react';
import { ChatTarget } from '../../types';
import { Send } from 'lucide-react';
import { soundManager } from '../../services/SoundManager';

interface MessageInputProps {
  chatTarget: ChatTarget;
  input: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  chatTarget,
  input,
  onInputChange,
  onSendMessage,
  onKeyPress,
}) => {
  const typingTimeoutRef = useRef<number | null>(null);
  const isTypingRef = useRef(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Start typing sound if not already playing
    if (value && !isTypingRef.current) {
      soundManager.startTypingSound();
      isTypingRef.current = true;
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Stop typing sound after 500ms of no input
    typingTimeoutRef.current = window.setTimeout(() => {
      soundManager.stopTypingSound();
      isTypingRef.current = false;
    }, 500);
    
    onInputChange(value);
  };

  const handleSendClick = () => {
    if (input.trim()) {
      // Stop typing sound
      soundManager.stopTypingSound();
      isTypingRef.current = false;
      
      // Play whoosh with pitch based on message length
      const pitch = Math.min(1.5, 0.5 + (input.length / 100));
      soundManager.play('whoosh', pitch);
      
      onSendMessage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      // Stop typing sound
      soundManager.stopTypingSound();
      isTypingRef.current = false;
      
      // Play whoosh
      const pitch = Math.min(1.5, 0.5 + (input.length / 100));
      soundManager.play('whoosh', pitch);
    }
    onKeyPress(e);
  };

  return (
    <div className="p-3 md:p-4 halftone-bg" style={{ backgroundColor: 'var(--color-bg-primary)', borderTop: '4px solid var(--color-border)', boxShadow: '0 -4px 0 var(--color-accent)' }}>
      <div className="flex gap-2 md:gap-3">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={`💬 @${chatTarget.username}...`}
          className="flex-1 px-3 md:px-4 py-2 md:py-3 focus:outline-none comic-outline font-bold text-sm md:text-base"
          style={{ 
            backgroundColor: 'white', 
            border: '3px solid var(--color-border)', 
            color: 'var(--color-text-primary)',
            boxShadow: '3px 3px 0 var(--color-border)',
            borderRadius: '15px',
            transform: 'rotate(-0.5deg)'
          }}
          onFocus={(e) => { 
            e.currentTarget.style.borderColor = 'var(--color-primary)'; 
            e.currentTarget.style.transform = 'rotate(0deg) scale(1.02)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border)';
            e.currentTarget.style.transform = 'rotate(-0.5deg) scale(1)';
          }}
        />
        <button
          onClick={handleSendClick}
          disabled={!input.trim()}
          className="px-3 md:px-6 py-2 md:py-3 disabled:cursor-not-allowed disabled:opacity-50 transition-all flex items-center gap-1 md:gap-2 font-black uppercase text-sm md:text-base"
          style={{ 
            background: input.trim() ? 'var(--color-primary)' : '#9ca3af',
            color: 'white',
            border: '4px solid var(--color-border)',
            boxShadow: '4px 4px 0 var(--color-border)',
            borderRadius: '15px',
            transform: 'rotate(1deg)',
            textShadow: '2px 2px 0 var(--color-border)'
          }}
          onMouseEnter={(e) => { 
            if (input.trim()) {
              e.currentTarget.style.animation = 'kapow 0.3s ease-in-out';
              e.currentTarget.style.transform = 'rotate(1deg) scale(1.05)';
            }
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.animation = '';
            e.currentTarget.style.transform = 'rotate(1deg) scale(1)';
          }}
        >
          <Send className="w-5 h-5" />
          <span className="hidden sm:inline">⚡ ZAP!</span>
          <span className="sm:hidden">⚡</span>
        </button>
      </div>
    </div>
  );
};
