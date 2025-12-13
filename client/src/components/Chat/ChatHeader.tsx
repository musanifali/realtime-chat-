// client/src/components/Chat/ChatHeader.tsx

import React from 'react';
import { ChatTarget } from '../../types';
import { Hash, User, Users, Lock } from 'lucide-react';

interface ChatHeaderProps {
  chatTarget: ChatTarget;
  roomUsers: string[];
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  chatTarget,
  roomUsers,
}) => {
  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-4 halftone-bg" style={{ backgroundColor: 'var(--color-secondary)', borderBottom: '4px solid var(--color-border)', boxShadow: '0 4px 0 var(--color-border)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center animate-comic-shake" style={{ backgroundColor: 'var(--color-accent)', border: '3px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}>
          {chatTarget.type === 'room' ? (
            <Hash className="w-5 h-5" style={{ color: 'var(--color-border)' }} />
          ) : (
            <User className="w-5 h-5" style={{ color: 'var(--color-border)' }} />
          )}
        </div>
        <h2 className="text-xl md:text-2xl font-black truncate uppercase" style={{ color: 'white', textShadow: '3px 3px 0 var(--color-border)', letterSpacing: '0.05em' }}>
          {chatTarget.type === 'room' ? `#${chatTarget.room}` : chatTarget.username}
        </h2>
      </div>
      {chatTarget.type === 'room' && (
        <div className="flex items-center gap-2 text-sm font-black uppercase px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-border)', border: '2px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}>
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">{roomUsers.length} HEROES</span>
          <span className="sm:hidden">{roomUsers.length}</span>
        </div>
      )}
      {chatTarget.type === 'user' && (
        <div className="flex items-center gap-2 text-sm font-black uppercase px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--color-tertiary)', color: 'white', border: '2px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}>
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">🔒 SECRET</span>
          <span className="sm:hidden">🔒</span>
        </div>
      )}
    </div>
  );
};
