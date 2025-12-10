// client/src/components/Chat/Message.tsx

import React from 'react';
import { ChatMessage } from '../../types';
import { formatTime } from '../../utils/messageUtils';

interface MessageProps {
  message: ChatMessage;
  isOwn: boolean;
}

export const Message: React.FC<MessageProps> = ({ message, isOwn }) => {
  if (message.type === 'system') {
    return (
      <div className="flex justify-center">
        <div className="px-3 py-1.5 rounded-full text-xs shadow-sm" style={{ backgroundColor: 'var(--color-surface-active)', color: 'var(--color-text-secondary)' }}>
          {message.text}
        </div>
      </div>
    );
  }

  const isPrivate = message.type === 'private_sent' || message.type === 'private_received';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div 
        className="rounded-2xl px-4 py-2 shadow-md max-w-[75%] md:max-w-[60%] lg:max-w-[50%]"
        style={{
          background: isOwn
            ? isPrivate
              ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)'
              : 'linear-gradient(135deg, var(--color-secondary) 0%, var(--color-primary) 100%)'
            : 'var(--color-surface)',
          color: isOwn ? 'var(--color-text-on-primary)' : 'var(--color-text-primary)',
          border: isOwn ? 'none' : '1px solid var(--color-border)',
          borderRadius: 'var(--radius-xl)'
        }}
      >
        {!isOwn && message.username && (
          <div className="text-xs font-semibold mb-1" style={{ color: 'var(--color-primary)' }}>
            {message.username}
          </div>
        )}
        <div className="break-words">{message.text}</div>
        <div 
          className="text-xs mt-1 text-right"
          style={{ 
            color: isOwn ? 'rgba(255, 255, 255, 0.8)' : 'var(--color-text-secondary)'
          }}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
