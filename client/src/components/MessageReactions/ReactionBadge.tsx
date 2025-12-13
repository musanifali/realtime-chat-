// client/src/components/MessageReactions/ReactionBadge.tsx
import React from 'react';

interface ReactionBadgeProps {
  emoji: string;
  count: number;
  hasReacted: boolean;
  onClick: () => void;
}

export const ReactionBadge: React.FC<ReactionBadgeProps> = ({ 
  emoji, 
  count, 
  hasReacted,
  onClick 
}) => {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-black transition-all hover:scale-110 active:scale-95"
      style={{
        backgroundColor: hasReacted ? 'var(--color-accent)' : 'white',
        border: hasReacted ? '3px solid var(--color-primary)' : '2px solid var(--color-border)',
        boxShadow: hasReacted ? '2px 2px 0 var(--color-border)' : '1px 1px 0 var(--color-border)',
        transform: hasReacted ? 'rotate(-2deg)' : 'none'
      }}
    >
      <span className="text-base">{emoji}</span>
      <span style={{ 
        color: hasReacted ? 'var(--color-primary)' : 'var(--color-text-primary)',
        textShadow: hasReacted ? '1px 1px 0 var(--color-border)' : 'none'
      }}>
        {count}
      </span>
    </button>
  );
};
