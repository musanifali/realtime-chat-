// client/src/components/Sidebar/UserInfo.tsx

import React from 'react';
import * as Avatar from '@radix-ui/react-avatar';
import { Wifi } from 'lucide-react';

interface UserInfoProps {
  username: string;
}

export const UserInfo: React.FC<UserInfoProps> = ({ username }) => {
  return (
    <div className="p-4" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
      <div className="flex items-center gap-3">
        <Avatar.Root className="inline-flex h-12 w-12 select-none items-center justify-center overflow-hidden rounded-full" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)', boxShadow: 'var(--shadow-md)' }}>
          <Avatar.Fallback className="text-white font-semibold text-lg">
            {username.charAt(0).toUpperCase()}
          </Avatar.Fallback>
        </Avatar.Root>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>{username}</div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-success)' }}>
            <Wifi className="w-3 h-3" />
            <span>Connected</span>
          </div>
        </div>
      </div>
    </div>
  );
};
