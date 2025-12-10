// client/src/components/Chat/MessageInput.tsx

import React from 'react';
import { ChatTarget } from '../../types';
import { Send } from 'lucide-react';

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
  return (
    <div className="p-4 backdrop-blur-md" style={{ backgroundColor: 'var(--color-surface)', borderTop: '1px solid var(--color-border)' }}>
      <div className="flex gap-2 md:gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyPress={onKeyPress}
          placeholder={
            chatTarget.type === 'room'
              ? `Message #${chatTarget.room}...`
              : `Message ${chatTarget.username}...`
          }
          className="flex-1 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent"
          style={{ 
            backgroundColor: 'var(--color-surface)', 
            border: '1px solid var(--color-border)', 
            color: 'var(--color-text-primary)',
            boxShadow: 'var(--shadow-sm)',
            borderRadius: 'var(--radius-md)'
          }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
        />
        <button
          onClick={onSendMessage}
          disabled={!input.trim()}
          className="px-4 md:px-6 py-3 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-2 font-medium"
          style={{ 
            background: input.trim() ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' : '#d1d5db',
            color: 'var(--color-text-on-primary)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--radius-md)'
          }}
          onMouseEnter={(e) => { if (input.trim()) e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
        >
          <Send className="w-5 h-5" />
          <span className="hidden sm:inline">Send</span>
        </button>
      </div>
    </div>
  );
};
