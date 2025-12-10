// client/src/components/Sidebar/Sidebar.tsx

import React from 'react';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import { UserInfo } from './UserInfo';
import { RoomList } from './RoomList';
import { DirectMessages } from './DirectMessages';
import { LogOut } from 'lucide-react';

interface SidebarProps {
  username: string;
  allRooms: string[];
  myRooms: Set<string>;
  allUsers: string[];
  currentRoom: string | null;
  currentUser: string | null;
  onRoomSelect: (room: string) => void;
  onUserSelect: (user: string) => void;
  onJoinRoom: (room: string) => void;
  onLeaveRoom: (room: string) => void;
  onCreateRoom: (room: string) => void;
  onDisconnect: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  username,
  allRooms,
  myRooms,
  allUsers,
  currentRoom,
  currentUser,
  onRoomSelect,
  onUserSelect,
  onJoinRoom,
  onLeaveRoom,
  onCreateRoom,
  onDisconnect,
}) => {
  return (
    <div className="h-full flex flex-col" style={{ backgroundColor: 'var(--color-surface)', borderRight: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
      <UserInfo username={username} />
      
      <ScrollArea.Root className="flex-1 overflow-hidden">
        <ScrollArea.Viewport className="h-full w-full">
          <div className="p-4 space-y-6">
            <RoomList
              allRooms={allRooms}
              myRooms={myRooms}
              currentRoom={currentRoom}
              onRoomSelect={onRoomSelect}
              onJoinRoom={onJoinRoom}
              onLeaveRoom={onLeaveRoom}
              onCreateRoom={onCreateRoom}
            />
            
            <DirectMessages
              allUsers={allUsers}
              currentUser={currentUser}
              onUserSelect={onUserSelect}
            />
          </div>
        </ScrollArea.Viewport>
        <ScrollArea.Scrollbar
          className="flex select-none touch-none p-0.5 transition-colors duration-150 ease-out data-[orientation=vertical]:w-2.5 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-2.5"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 rounded-full relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" style={{ backgroundColor: 'var(--color-border-dark)' }} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      
      <div className="p-4" style={{ borderTop: '1px solid var(--color-border)' }}>
        <button
          onClick={onDisconnect}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-200 font-medium"
          style={{ 
            background: 'linear-gradient(135deg, var(--color-error) 0%, var(--color-accent) 100%)', 
            color: 'var(--color-text-on-primary)',
            boxShadow: 'var(--shadow-md)',
            borderRadius: 'var(--radius-md)'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
        >
          <LogOut className="w-4 h-4" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );
};
