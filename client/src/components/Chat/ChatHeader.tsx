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
    <div className="flex items-center justify-between px-4 md:px-6 py-4 backdrop-blur-md" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="flex items-center gap-3 min-w-0">
        {chatTarget.type === 'room' ? (
          <Hash className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
        ) : (
          <User className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-primary)' }} />
        )}
        <h2 className="text-lg font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
          {chatTarget.type === 'room' ? chatTarget.room : chatTarget.username}
        </h2>
      </div>
      {chatTarget.type === 'room' && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">{roomUsers.length} members</span>
          <span className="sm:hidden">{roomUsers.length}</span>
        </div>
      )}
      {chatTarget.type === 'user' && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-primary)' }}>
          <Lock className="w-4 h-4" />
          <span className="hidden sm:inline">Private</span>
        </div>
      )}
    </div>
  );
};
