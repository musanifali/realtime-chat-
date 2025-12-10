// client/src/components/Sidebar/DirectMessages.tsx

import React from 'react';
import * as Avatar from '@radix-ui/react-avatar';
import { User } from 'lucide-react';

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
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
        Direct Messages
      </h3>

      <div className="space-y-1">
        {allUsers.length > 0 ? (
          allUsers.map((user) => {
            const isActive = currentUser === user;
            return (
              <button
                key={user}
                onClick={() => onUserSelect(user)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white shadow-md'
                    : 'hover:bg-purple-100 text-gray-900'
                }`}
              >
                <Avatar.Root className="inline-flex h-8 w-8 select-none items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-300 to-pink-300 shadow-sm">
                  <Avatar.Fallback className="text-white font-medium text-sm">
                    {user.charAt(0).toUpperCase()}
                  </Avatar.Fallback>
                </Avatar.Root>
                <span className="font-medium truncate">{user}</span>
                <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--color-success)' }} />
              </button>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-gray-600">
            <User className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">No other users online</p>
          </div>
        )}
      </div>
    </div>
  );
};
