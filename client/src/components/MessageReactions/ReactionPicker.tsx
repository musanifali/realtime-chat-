// client/src/components/MessageReactions/ReactionPicker.tsx
import React from 'react';
import { soundManager } from '../../services/SoundManager';

interface ReactionPickerProps {
  onReact: (emoji: string) => void;
  onClose: () => void;
}

const reactions = ['💥', '⚡', '🔥', '😂', '👍', '❤️', '🎉', '😍', '🤯', '💯'];

export const ReactionPicker: React.FC<ReactionPickerProps> = ({ onReact, onClose }) => {
  const handleReact = (emoji: string) => {
    soundManager.playClick();
    onReact(emoji);
    onClose();
  };

  return (
    <div 
      className="absolute bottom-full mb-2 left-0 z-50 animate-comic-pop"
      onClick={(e) => e.stopPropagation()}
    >
      <div 
        className="flex gap-1 p-2 rounded-lg"
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
            className="w-10 h-10 flex items-center justify-center text-2xl rounded-lg transition-all hover:scale-125 active:scale-95"
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
