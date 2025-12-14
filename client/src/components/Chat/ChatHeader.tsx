// client/src/components/Chat/ChatHeader.tsx

import React from 'react';
import { ChatTarget } from '../../types';
import { User, Lock, Menu } from 'lucide-react';
import { soundManager } from '../../services/SoundManager';

interface ChatHeaderProps {
  chatTarget: ChatTarget;
  onToggleSidebar?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ chatTarget, onToggleSidebar }) => {
  const handleMenuClick = () => {
    soundManager.playClick();
    onToggleSidebar?.();
  };

  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-4 halftone-bg" style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '4px solid var(--color-border)', boxShadow: '0 4px 0 var(--color-border)' }}>
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger Menu Button - Only on Mobile */}
        {onToggleSidebar && (
          <button
            onClick={handleMenuClick}
            className="md:hidden flex-shrink-0 p-2 rounded-md transition-all duration-200"
            style={{ 
              background: 'var(--color-accent)', 
              border: '3px solid var(--color-border)',
              boxShadow: '3px 3px 0 var(--color-border)',
            }}
          >
            <Menu className="w-5 h-5" style={{ color: 'var(--color-border)' }} />
          </button>
        )}
        
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center animate-comic-shake" style={{ backgroundColor: 'var(--color-accent)', border: '3px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}>
          <User className="w-5 h-5" style={{ color: 'var(--color-border)' }} />
        </div>
        <h2 className="text-xl md:text-2xl font-black truncate uppercase" style={{ color: 'white', textShadow: '3px 3px 0 var(--color-border)', letterSpacing: '0.05em' }}>
          @{chatTarget.username}
        </h2>
      </div>
      <div className="flex items-center gap-2 text-sm font-black uppercase px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--color-tertiary)', color: 'white', border: '2px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}>
        <Lock className="w-4 h-4" />
        <span className="hidden sm:inline">🔒 PRIVATE</span>
        <span className="sm:hidden">🔒</span>
      </div>
    </div>
  );
};
