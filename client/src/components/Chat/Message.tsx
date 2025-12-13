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
      <div className="flex justify-center animate-comic-pop">
        <div className="px-4 py-2 text-sm font-black uppercase bendots-bg comic-outline" 
          style={{ 
            backgroundColor: 'var(--color-accent)', 
            color: 'var(--color-text-primary)',
            border: '3px solid var(--color-border)',
            borderRadius: '20px',
            boxShadow: '3px 3px 0 var(--color-border)',
            transform: 'rotate(-1deg)'
          }}>
          ⚡ {message.text} ⚡
        </div>
      </div>
    );
  }

  const isPrivate = message.type === 'private_sent' || message.type === 'private_received';

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-comic-pop`}>
      <div 
        className="speech-bubble-tail px-4 py-3 max-w-[75%] md:max-w-[60%] lg:max-w-[50%] relative"
        style={{
          background: isOwn
            ? isPrivate
              ? 'var(--color-tertiary)'
              : 'var(--color-accent)'
            : 'white',
          color: 'var(--color-text-primary)',
          border: '3px solid var(--color-border)',
          borderRadius: '20px',
          boxShadow: isOwn ? '4px 4px 0 var(--color-border)' : '-4px 4px 0 var(--color-border)',
          transform: isOwn ? 'rotate(1deg)' : 'rotate(-1deg)',
          fontWeight: '700'
        }}
      >
        {!isOwn && message.username && (
          <div className="text-xs font-black mb-1 uppercase" style={{ color: 'var(--color-primary)', textShadow: '1px 1px 0 var(--color-border)' }}>
            {message.username}
          </div>
        )}
        <div className="break-words text-base">{message.text}</div>
        <div 
          className="text-xs mt-1.5 text-right font-bold"
          style={{ 
            color: 'var(--color-text-secondary)',
            opacity: 0.8
          }}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};
