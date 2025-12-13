// client/src/components/Chat/TypingIndicator.tsx

import React from 'react';

interface TypingIndicatorProps {
  usernames: string[];
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ usernames }) => {
  if (usernames.length === 0) return null;

  const displayText = usernames.length === 1 
    ? `${usernames[0]}`
    : `${usernames.length} heroes`;

  return (
    <div className="px-4 py-2 animate-comic-pop">
      <div 
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
        style={{
          backgroundColor: 'var(--color-accent)',
          border: '2px solid var(--color-border)',
          boxShadow: '2px 2px 0 var(--color-border)',
          transform: 'rotate(-0.5deg)'
        }}
      >
        <div className="flex gap-1">
          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-border)', animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-border)', animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-border)', animationDelay: '300ms' }} />
        </div>
        <span className="text-xs font-black uppercase" style={{ color: 'var(--color-border)' }}>
          ⌨️ TAP TAP TAP... {displayText}
        </span>
      </div>
    </div>
  );
};
