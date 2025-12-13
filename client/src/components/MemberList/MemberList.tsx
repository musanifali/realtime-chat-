// client/src/components/MemberList/MemberList.tsx

import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Avatar from '@radix-ui/react-avatar';
import { Users } from 'lucide-react';

interface MemberListProps {
  members: string[];
  currentUsername: string;
  onMemberClick: (member: string) => void;
}

export const MemberList: React.FC<MemberListProps> = ({
  members,
  currentUsername,
  onMemberClick,
}) => {
  return (
    <div className="h-full flex flex-col bendots-bg" style={{ backgroundColor: 'var(--color-bg-secondary)', borderLeft: '4px solid var(--color-border)', boxShadow: '-4px 0 0 var(--color-border)' }}>
      <div className="p-4 halftone-bg" style={{ borderBottom: '4px solid var(--color-border)', backgroundColor: 'var(--color-tertiary)', boxShadow: '0 4px 0 var(--color-border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-accent)', border: '2px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}>
            <Users className="w-4 h-4" style={{ color: 'var(--color-border)' }} />
          </div>
          <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'white', textShadow: '2px 2px 0 var(--color-border)' }}>💪 HEROES</h3>
          <span className="ml-auto text-xs font-black px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-border)', border: '2px solid var(--color-border)' }}>{members.length}</span>
        </div>
      </div>
      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="p-3 space-y-2">
            {members.map((user) => (
              <button
                key={user}
                onClick={() => user !== currentUsername && onMemberClick(user)}
                disabled={user === currentUsername}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all disabled:cursor-default text-left font-bold"
                style={{ backgroundColor: user === currentUsername ? 'var(--color-accent)' : 'white', border: '2px solid var(--color-border)', boxShadow: user === currentUsername ? '3px 3px 0 var(--color-border)' : 'none' }}
                onMouseEnter={(e) => { if (user !== currentUsername) { e.currentTarget.style.backgroundColor = 'var(--color-quaternary)'; e.currentTarget.style.transform = 'scale(1.02)'; } }}
                onMouseLeave={(e) => { if (user !== currentUsername) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'scale(1)'; } }}
              >
              <Avatar.Root className="inline-flex h-10 w-10 select-none items-center justify-center overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-primary)', border: '2px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}>
                  <Avatar.Fallback className="text-white font-black text-sm">
                    {user.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <span className="flex-1 truncate text-sm uppercase">{user}</span>
                {user === currentUsername && (
                  <span className="text-xs px-2 py-1 rounded-full font-black" style={{ backgroundColor: 'var(--color-secondary)', color: 'white', border: '2px solid var(--color-border)', textShadow: '1px 1px 0 var(--color-border)' }}>YOU</span>
                )}
                {user !== currentUsername && (
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--color-quaternary)', border: '1px solid var(--color-border)' }} />
                )}
              </button>
            ))}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-1 transition-colors duration-150 ease-out data-[orientation=vertical]:w-4"
          style={{ backgroundColor: 'var(--color-accent)', border: '2px solid var(--color-border)' }}
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1" style={{ backgroundColor: 'var(--color-primary)', border: '2px solid var(--color-border)', borderRadius: '8px' }} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
};
