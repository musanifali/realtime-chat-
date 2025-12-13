// client/src/components/Sidebar/UserInfo.tsx

import React from 'react';
import * as Avatar from '@radix-ui/react-avatar';
import { Wifi } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';

interface UserInfoProps {
  username: string;
}

export const UserInfo: React.FC<UserInfoProps> = ({ username }) => {
  return (
    <div className="p-3 md:p-4 halftone-bg" style={{ borderBottom: '4px solid var(--color-border)', backgroundColor: 'var(--color-accent)', boxShadow: '0 4px 0 var(--color-border)' }}>
      <div className="flex items-center gap-2 md:gap-3">
        <Avatar.Root className="inline-flex h-12 w-12 md:h-14 md:w-14 select-none items-center justify-center overflow-hidden rounded-full animate-comic-shake" style={{ background: 'var(--color-primary)', border: '3px solid var(--color-border)', boxShadow: '3px 3px 0 var(--color-border)' }}>
          <Avatar.Fallback className="text-white font-black text-xl md:text-2xl">
            {username.charAt(0).toUpperCase()}
          </Avatar.Fallback>
        </Avatar.Root>
        <div className="flex-1 min-w-0">
          <div className="font-black text-base md:text-lg truncate uppercase" style={{ color: 'var(--color-border)', textShadow: '2px 2px 0 var(--color-accent-light)' }}>{username}</div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-quaternary)', color: 'var(--color-border)', border: '2px solid var(--color-border)' }}>
            <Wifi className="w-3 h-3" />
            <span className="hidden sm:inline">⚡ ONLINE</span>
            <span className="sm:hidden">⚡</span>
          </div>
        </div>
        <ThemeToggle />
      </div>
    </div>
  );
};
