// client/src/components/GifSticker/ComicImageFrame.tsx
import React from 'react';

interface ComicImageFrameProps {
  src: string;
  alt?: string;
  isOwn?: boolean;
}

export const ComicImageFrame: React.FC<ComicImageFrameProps> = ({ src, alt = 'Image', isOwn = false }) => {
  return (
    <div 
      className="relative inline-block animate-comic-pop"
      style={{
        transform: isOwn ? 'rotate(1deg)' : 'rotate(-1deg)'
      }}
    >
      {/* Comic Border Frame */}
      <div 
        className="relative overflow-hidden"
        style={{
          border: '4px solid var(--color-border)',
          borderRadius: '12px',
          boxShadow: isOwn ? '5px 5px 0 var(--color-border)' : '-5px 5px 0 var(--color-border)',
          maxWidth: '300px',
          backgroundColor: 'white'
        }}
      >
        <img 
          src={src} 
          alt={alt}
          className="w-full h-auto block"
          style={{
            border: '3px solid var(--color-accent)',
            borderRadius: '8px'
          }}
        />
        
        {/* Corner Decorations */}
        <div 
          className="absolute top-1 left-1 font-black text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'white',
            border: '2px solid var(--color-border)',
            transform: 'rotate(-5deg)',
            textShadow: '1px 1px 0 var(--color-border)'
          }}
        >
          POW!
        </div>
        
        <div 
          className="absolute bottom-1 right-1 font-black text-xs px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-text-primary)',
            border: '2px solid var(--color-border)',
            transform: 'rotate(5deg)',
            textShadow: '1px 1px 0 white'
          }}
        >
          ⚡
        </div>
      </div>
      
      {/* Starburst background effect */}
      <div 
        className="absolute inset-0 -z-10 opacity-20"
        style={{
          background: `repeating-conic-gradient(
            var(--color-accent) 0deg 10deg,
            transparent 10deg 20deg
          )`,
          borderRadius: '12px',
          transform: 'scale(1.1)'
        }}
      />
    </div>
  );
};
