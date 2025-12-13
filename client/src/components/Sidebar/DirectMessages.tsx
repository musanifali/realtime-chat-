// client/src/components/Sidebar/DirectMessages.tsx

import React from 'react';
import * as Avatar from '@radix-ui/react-avatar';
import { User } from 'lucide-react';
import { soundManager } from '../../services/SoundManager';

interface DirectMessagesProps {
  allUsers: string[];
  currentUser: string | null;
  onUserSelect: (user: string) => void;
}

export const DirectMessages: React.FC<DirectMessagesProps> = ({
  allUsers,
  currentUser,
  onUserSelect,
}) => {
  const handleUserSelect = (user: string) => {
    soundManager.play('click');
    onUserSelect(user);
  };
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-black uppercase tracking-wider mb-3" style={{ color: 'var(--color-border)', textShadow: '2px 2px 0 var(--color-accent)' }}>
        💬 SECRET CHATS
      </h3>

      <div className="space-y-2">
        {allUsers.length > 0 ? (
          allUsers.map((user) => {
            const isActive = currentUser === user;
            return (
              <button
                key={user}
                onClick={() => handleUserSelect(user)}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all font-bold"
                style={{
                  background: isActive ? 'var(--color-tertiary)' : 'white',
                  color: isActive ? 'white' : 'var(--color-text-primary)',
                  border: '2px solid var(--color-border)',
                  boxShadow: isActive ? '3px 3px 0 var(--color-border)' : 'none',
                  transform: isActive ? 'rotate(-0.5deg)' : 'none'
                }}
                onMouseEnter={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'rotate(0.5deg) scale(1.02)'; } }}
                onMouseLeave={(e) => { if (!isActive) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'none'; } }}
              >
                <Avatar.Root className="inline-flex h-9 w-9 select-none items-center justify-center overflow-hidden rounded-full" style={{ background: 'var(--color-quaternary)', border: '2px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}>
                  <Avatar.Fallback className="text-white font-black text-sm">
                    {user.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <span className="truncate uppercase text-sm">{user}</span>
                <div className="ml-auto w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-quaternary)', border: '1px solid var(--color-border)' }} />
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4 rounded-lg" style={{ backgroundColor: 'white', border: '2px dashed var(--color-border)' }}>
            <User className="w-10 h-10 mb-2" style={{ color: 'var(--color-border)' }} />
            <p className="text-sm font-bold text-center" style={{ color: 'var(--color-text-secondary)' }}>NO HEROES ONLINE</p>
          </div>
        )}
      </div>
    </div>
  );
};
