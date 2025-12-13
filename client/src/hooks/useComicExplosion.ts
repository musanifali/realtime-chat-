// client/src/hooks/useComicExplosion.ts

import { useState, useCallback } from 'react';

export const useComicExplosion = () => {
  const [explosions, setExplosions] = useState<Array<{ id: string; text: string }>>([]);

  const triggerExplosion = useCallback((text: string = 'KAPOW!') => {
    const id = Date.now().toString();
    setExplosions(prev => [...prev, { id, text }]);
    
    // Remove explosion after animation completes
    setTimeout(() => {
      setExplosions(prev => prev.filter(exp => exp.id !== id));
    }, 800);
  }, []);

  const removeExplosion = useCallback((id: string) => {
    setExplosions(prev => prev.filter(exp => exp.id !== id));
  }, []);

  return { explosions, triggerExplosion, removeExplosion };
};
