// client/src/components/MessageReactions/FloatingReaction.tsx
import React, { useEffect, useState } from 'react';

interface FloatingReactionProps {
  emoji: string;
  onComplete: () => void;
}

export const FloatingReaction: React.FC<FloatingReactionProps> = ({ emoji, onComplete }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!isVisible) return null;

  const randomX = Math.random() * 40 - 20; // -20 to 20px

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        fontSize: '2rem',
        animation: 'float-up 2s ease-out forwards',
        left: '50%',
        bottom: '0',
        transform: `translateX(${randomX}px)`,
        zIndex: 100
      }}
    >
      {emoji}
      <style>{`
        @keyframes float-up {
          0% {
            transform: translateX(${randomX}px) translateY(0) scale(1);
            opacity: 1;
          }
          50% {
            transform: translateX(${randomX}px) translateY(-50px) scale(1.5) rotate(${Math.random() * 40 - 20}deg);
            opacity: 1;
          }
          100% {
            transform: translateX(${randomX}px) translateY(-100px) scale(0.5) rotate(${Math.random() * 80 - 40}deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
