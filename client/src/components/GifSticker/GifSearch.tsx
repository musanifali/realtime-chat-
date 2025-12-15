// client/src/components/GifSticker/GifSearch.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
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
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number>();
  const offsetRef = useRef(0);

  // Using Giphy API
  const GIPHY_API_KEY = 'VS7PHn5T6dmwtT5SidudS0kMItkvsgdN';
  const LIMIT = 20;
  
  const searchGifs = useCallback(async (reset: boolean = false) => {
    if (!searchTerm.trim()) {
      setGifs([]);
      return;
    }
    
    setIsLoading(true);
    const currentOffset = reset ? 0 : offsetRef.current;
    
    try {
      const response = await fetch(
        `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(searchTerm)}&limit=${LIMIT}&offset=${currentOffset}&rating=g`
      );
      const data = await response.json();
      const newGifs = data.data || [];
      
      if (reset) {
        setGifs(newGifs);
        offsetRef.current = LIMIT;
        setOffset(LIMIT);
      } else {
        setGifs(prev => [...prev, ...newGifs]);
        offsetRef.current += LIMIT;
        setOffset(prev => prev + LIMIT);
      }
      
      setHasMore(newGifs.length === LIMIT);
    } catch (error) {
      console.error('Error fetching GIFs:', error);
      if (reset) setGifs([]);
    }
    setIsLoading(false);
  }, [searchTerm]);

  // Auto-search with debounce when typing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchTerm.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        offsetRef.current = 0;
        setOffset(0);
        setHasMore(true);
        searchGifs(true);
      }, 500); // Wait 500ms after user stops typing
    } else {
      setGifs([]);
      offsetRef.current = 0;
      setOffset(0);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm, searchGifs]);

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || isLoading || !hasMore) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;
    
    // Load more when scrolled 70% of the way down
    if (scrollPercentage > 0.7) {
      console.log('🔄 Loading more GIFs...', { scrollPercentage, offset: offsetRef.current });
      searchGifs(false);
    }
  }, [isLoading, hasMore, searchGifs]);

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, [handleScroll]);

  const handleSelect = (gifUrl: string) => {
    soundManager.playClick();
    onSelect(gifUrl);
    onClose();
  };

  return (
    <div className="flex flex-col h-full animate-comic-pop">
      <div className="flex items-center justify-between mb-2 px-3 sm:px-4 pt-3 sm:pt-4">
        <h3 className="font-black uppercase text-xs sm:text-sm" style={{ color: 'var(--color-primary)' }}>
          🎬 GIF SEARCH
        </h3>
        <button
          onClick={onClose}
          className="text-xs font-bold px-2 py-1 rounded hover:scale-110 transition-transform"
          style={{ border: '2px solid var(--color-border)' }}
        >
          ✕
        </button>
      </div>

      {/* Search Input */}
      <div className="px-3 sm:px-4 mb-2 sm:mb-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Type to search GIFs..."
            autoFocus
            className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 font-bold text-xs sm:text-sm focus:outline-none"
            style={{
              backgroundColor: 'white',
              border: '2px solid var(--color-border)',
              borderRadius: '6px'
            }}
          />
          {isLoading && offset === 0 && (
            <div className="flex items-center px-2">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--color-primary)' }} />
            </div>
          )}
        </div>
        {!searchTerm && (
          <p className="text-[10px] sm:text-xs mt-1.5 sm:mt-2 font-bold" style={{ color: 'var(--color-text-secondary)' }}>
            💡 Start typing to search GIFs
          </p>
        )}
      </div>

      {/* GIF Grid with Infinite Scroll */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 sm:px-4 pb-3 sm:pb-4">
        {gifs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-2">
            {gifs.map((gif) => (
              <button
                key={gif.id}
                onClick={() => handleSelect(gif.images.fixed_height_small.url)}
                className="relative overflow-hidden transition-all hover:scale-105 active:scale-95"
                style={{
                  aspectRatio: '1',
                  border: '2px solid var(--color-border)',
                  borderRadius: '6px',
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

        {/* Loading More */}
        {isLoading && offset > 0 && (
          <div className="text-center py-4 font-bold flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading more...
          </div>
        )}

        {/* No Results */}
        {!isLoading && searchTerm && gifs.length === 0 && (
          <div className="text-center py-8 font-bold" style={{ color: 'var(--color-text-secondary)' }}>
            No GIFs found! Try another search. 🔍
          </div>
        )}
      </div>
    </div>
  );
};