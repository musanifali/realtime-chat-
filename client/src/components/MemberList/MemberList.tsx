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
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
          <Users className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
          <h3 className="text-sm font-semibold uppercase tracking-wider">Members</h3>
          <span className="ml-auto text-xs" style={{ color: 'var(--color-text-secondary)' }}>{members.length}</span>
        </div>
      </div>
      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="p-3 space-y-1">
            {members.map((user) => (
              <button
                key={user}
                onClick={() => user !== currentUsername && onMemberClick(user)}
                disabled={user === currentUsername}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors disabled:cursor-default text-left"
                style={user !== currentUsername ? { } : {}}
                onMouseEnter={(e) => { if (user !== currentUsername) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                onMouseLeave={(e) => { if (user !== currentUsername) e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
              <Avatar.Root className="inline-flex h-10 w-10 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-400 to-pink-400 shadow-md">
                  <Avatar.Fallback className="text-white font-medium text-sm">
                    {user.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <span className="flex-1 truncate text-sm" style={{ color: 'var(--color-text-primary)' }}>{user}</span>
                {user === currentUsername && (
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)', color: 'var(--color-text-on-primary)' }}>You</span>
                )}
                {user !== currentUsername && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
                )}
              </button>
            ))}
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 transition-colors duration-150 ease-out data-[orientation=vertical]:w-2.5"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 rounded-full" style={{ backgroundColor: 'var(--color-border-dark)' }} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
    </div>
  );
};
