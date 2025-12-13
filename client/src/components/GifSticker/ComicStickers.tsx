// client/src/components/GifSticker/ComicStickers.tsx
import React from 'react';
import { soundManager } from '../../services/SoundManager';

interface ComicStickersProps {
  onSelect: (sticker: string) => void;
  onClose: () => void;
}

const comicStickers = [
  { text: 'BOOM!', color: '#ff0000', rotation: -5 },
  { text: 'POW!', color: '#ffff00', rotation: 5 },
  { text: 'WHAM!', color: '#ff00ff', rotation: -3 },
  { text: 'ZAP!', color: '#00ffff', rotation: 7 },
  { text: 'KAPOW!', color: '#ff0000', rotation: -7 },
  { text: 'BAM!', color: '#0066ff', rotation: 4 },
  { text: 'BANG!', color: '#ff6600', rotation: -6 },
  { text: 'CRASH!', color: '#9900ff', rotation: 3 },
  { text: 'SMASH!', color: '#ff0066', rotation: -4 },
  { text: 'WHOOSH!', color: '#00ff00', rotation: 6 },
];

export const ComicStickers: React.FC<ComicStickersProps> = ({ onSelect, onClose }) => {
  const handleSelect = (text: string) => {
    soundManager.playClick();
    onSelect(text);
    onClose();
  };

  return (
    <div className="p-4 animate-comic-pop">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black uppercase text-sm" style={{ color: 'var(--color-primary)' }}>
          💥 COMIC STICKERS
        </h3>
        <button
          onClick={onClose}
          className="text-xs font-bold px-2 py-1 rounded"
          style={{ border: '2px solid var(--color-border)' }}
        >
          ✕
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {comicStickers.map((sticker, index) => (
          <button
            key={index}
            onClick={() => handleSelect(sticker.text)}
            className="relative h-24 flex items-center justify-center transition-all hover:scale-110 active:scale-95 overflow-hidden"
            style={{
              backgroundColor: 'white',
              border: '4px solid var(--color-border)',
              borderRadius: '12px',
              boxShadow: '4px 4px 0 var(--color-border)',
              transform: `rotate(${sticker.rotation}deg)`
            }}
          >
            {/* Starburst background */}
            <div 
              className="absolute inset-0"
              style={{
                background: `
                  repeating-conic-gradient(
                    from 0deg,
                    ${sticker.color} 0deg 10deg,
                    transparent 10deg 20deg
                  )
                `,
                opacity: 0.3
              }}
            />
            
            {/* Text */}
            <span 
              className="relative font-black text-2xl uppercase z-10"
              style={{
                color: sticker.color,
                textShadow: `
                  3px 3px 0 var(--color-border),
                  -1px -1px 0 white,
                  1px -1px 0 white,
                  -1px 1px 0 white,
                  1px 1px 0 white
                `,
                WebkitTextStroke: '2px var(--color-border)',
                letterSpacing: '0.05em'
              }}
            >
              {sticker.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
