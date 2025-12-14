// client/src/components/MessageReactions/ReactionPicker.tsx
import React from 'react';
import { soundManager } from '../../services/SoundManager';

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  onClose: () => void;
  isOwn: boolean;
}

const reactions = ['💥', '⚡', '🔥', '😂', '👍', '❤️', '🎉', '😍', '🤯', '💯'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onReact, onClose, isOwn }) => {
  const handleReact = (emoji: string) => {
    soundManager.playClick();
    onReact(emoji);
    onClose();
  };

  return (
    <div 
      className={`absolute top-full mt-2 z-50 animate-comic-pop ${isOwn ? 'right-0' : 'left-0'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="flex gap-1 sm:gap-1.5 p-2 sm:p-2.5 rounded-lg"
        style={{
          backgroundColor: 'var(--color-accent)',
          border: '3px solid var(--color-border)',
          boxShadow: '4px 4px 0 var(--color-border)'
        }}
      >
        {reactions.map((emoji, index) => (
          <button
            key={index}
            onClick={() => handleReact(emoji)}
            className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-xl sm:text-2xl rounded-lg transition-all hover:scale-125 active:scale-95"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--color-border)',
              boxShadow: '2px 2px 0 var(--color-border)'
            }}
            title={`React with ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};
