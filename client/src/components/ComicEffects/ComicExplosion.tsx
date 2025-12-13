// client/src/components/ComicEffects/ComicExplosion.tsx

import React, { useEffect, useState } from 'react';

interface ComicExplosionProps {
  text?: string;
  show?: boolean;
  onComplete?: () => void;
}

export const ComicExplosion: React.FC<ComicExplosionProps> = ({ 
  text = 'KAPOW!', 
  show = true,
  onComplete 
}) => {
  const [visible, setVisible] = useState(show);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, 800);
    return () => clearTimeout(timer);
  }, [onComplete]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
      <div 
        className="comic-text animate-comic-pop"
        style={{
          fontSize: '8rem',
          color: 'var(--color-primary)',
          textShadow: `
            4px 4px 0 var(--color-border),
            -2px -2px 0 var(--color-accent),
            2px -2px 0 var(--color-accent),
            -2px 2px 0 var(--color-accent),
            0 0 20px var(--color-accent)
          `,
          WebkitTextStroke: '3px var(--color-border)',
          transform: 'rotate(-5deg)',
          animation: 'comic-pop 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55), starburst 0.8s ease-out'
        }}
      >
        {text}
      </div>
    </div>
  );
};

// Starburst effect for buttons
export const StarburstEffect: React.FC<{ color?: string }> = ({ color = 'var(--color-accent)' }) => {
  return (
    <div className="absolute inset-0 pointer-events-none" style={{ overflow: 'visible' }}>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute top-1/2 left-1/2"
          style={{
            width: '4px',
            height: '40px',
            backgroundColor: color,
            transform: `translate(-50%, -50%) rotate(${i * 45}deg)`,
            transformOrigin: 'center',
            animation: 'starburst 0.5s ease-out forwards',
            animationDelay: `${i * 0.05}s`
          }}
        />
      ))}
    </div>
  );
};
