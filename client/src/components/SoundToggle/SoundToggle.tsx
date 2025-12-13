// client/src/components/SoundToggle/SoundToggle.tsx

import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../../services/SoundManager';

export const SoundToggle: React.FC = () => {
  const [isMuted, setIsMuted] = useState(soundManager.isSoundMuted());

  useEffect(() => {
    setIsMuted(soundManager.isSoundMuted());
  }, []);

  const toggleSound = () => {
    const newMutedState = soundManager.toggleMute();
    setIsMuted(newMutedState);
    
    // Play a click sound if unmuting
    if (!newMutedState) {
      setTimeout(() => soundManager.play('click'), 100);
    }
  };

  return (
    <button
      onClick={toggleSound}
      className="p-2 transition-all duration-200"
      style={{ 
        background: isMuted ? 'var(--color-text-secondary)' : 'var(--color-success)', 
        border: '3px solid var(--color-border)',
        boxShadow: '3px 3px 0 var(--color-border)',
        borderRadius: '50%',
        color: 'white',
        opacity: isMuted ? 0.6 : 1
      }}
      onMouseEnter={(e) => { 
        e.currentTarget.style.transform = 'rotate(-10deg) scale(1.1)'; 
      }}
      onMouseLeave={(e) => { 
        e.currentTarget.style.transform = 'rotate(0deg) scale(1)'; 
      }}
      title={isMuted ? '🔇 Sounds Off' : '🔊 Sounds On'}
    >
      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
    </button>
  );
};
