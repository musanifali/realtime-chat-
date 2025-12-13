// client/src/components/Chat/TypingIndicator.tsx

import React from 'react';

interface TypingIndicatorProps {
  username: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ username }) => {
  return (
    <div className="px-3 md:px-4 py-2 animate-comic-pop">
      <div 
        className="inline-flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full"
        style={{
          backgroundColor: 'var(--color-accent)',
          border: '2px solid var(--color-border)',
          boxShadow: '2px 2px 0 var(--color-border)',
          transform: 'rotate(-0.5deg)'
        }}
      >
        <div className="flex gap-1">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-border)', animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-border)', animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full animate-bounce" style={{ backgroundColor: 'var(--color-border)', animationDelay: '300ms' }} />
        </div>
        <span className="text-xs font-black uppercase truncate max-w-[150px] md:max-w-none" style={{ color: 'var(--color-border)' }}>
          ⌨️ <span className="hidden sm:inline">{username} IS TYPING...</span>
          <span className="sm:hidden">TYPING...</span>
        </span>
      </div>
    </div>
  );
};
