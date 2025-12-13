// client/src/components/GifSticker/GifSearch.tsx
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { soundManager } from '../../services/SoundManager';

interface GifSearchProps {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
}

interface GifResult {
  id: string;
  images: {
    fixed_height_small: {
      url: string;
    };
  };
}

export const GifSearch: React.FC<GifSearchProps> = ({ onSelect, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Using Giphy API (you'll need to get a free API key from developers.giphy.com)
  const GIPHY_API_KEY = 'VS7PHn5T6dmwtT5SidudS0kMItkvsgdN'; // Replace with actual key
  
  const searchGifs = async () => {
    if (!searchTerm.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=20&rating=g`
      );
      const data = await response.json();
      setGifs(data.data || []);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      // Fallback to demo data
      setGifs([]);
    }
    setIsLoading(false);
  };

  const handleSelect = (gifUrl: string) => {
    soundManager.playClick();
    onSelect(gifUrl);
    onClose();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchGifs();
    }
  };

  return (
    <div className="p-4 max-h-96 overflow-y-auto animate-comic-pop">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-black uppercase text-sm" style={{ color: 'var(--color-primary)' }}>
          🎬 GIF SEARCH
        </h3>
        <button
          onClick={onClose}
          className="text-xs font-bold px-2 py-1 rounded"
          style={{ border: '2px solid var(--color-border)' }}
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <div className="flex gap-2 mb-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Search GIFs..."
          className="flex-1 px-3 py-2 font-bold text-sm focus:outline-none"
          style={{
            backgroundColor: 'white',
            border: '2px solid var(--color-border)',
            borderRadius: '8px'
          }}
        />
        <button
          onClick={searchGifs}
          disabled={isLoading || !searchTerm.trim()}
          className="px-3 py-2 font-black uppercase text-sm transition-all hover:scale-105 disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-accent)',
            border: '2px solid var(--color-border)',
            borderRadius: '8px',
            boxShadow: '2px 2px 0 var(--color-border)'
          }}
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* Demo Message */}
      {GIPHY_API_KEY === 'YOUR_GIPHY_API_KEY' && (
        <div 
          className="p-3 mb-3 text-xs font-bold rounded-lg"
          style={{
            backgroundColor: 'var(--color-accent)',
            border: '2px solid var(--color-border)'
          }}
        >
          ⚠️ Demo Mode: Get a free API key from developers.giphy.com to enable GIF search!
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center py-8 font-bold">
          Loading GIFs... 🔄
        </div>
      )}

      {/* GIF Grid */}
      {!isLoading && gifs.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {gifs.map((gif) => (
            <button
              key={gif.id}
              onClick={() => handleSelect(gif.images.fixed_height_small.url)}
              className="relative overflow-hidden transition-all hover:scale-105 active:scale-95 comic-outline"
              style={{
                aspectRatio: '1',
                border: '3px solid var(--color-border)',
                borderRadius: '8px',
                boxShadow: '2px 2px 0 var(--color-border)'
              }}
            >
              <img
                src={gif.images.fixed_height_small.url}
                alt="GIF"
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && searchTerm && gifs.length === 0 && (
        <div className="text-center py-8 font-bold" style={{ color: 'var(--color-text-secondary)' }}>
          No GIFs found! Try another search. 🔍
        </div>
      )}
    </div>
  );
};
