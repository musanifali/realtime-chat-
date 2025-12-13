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
    <div className="h-full flex flex-col bendots-bg" style={{ backgroundColor: 'var(--color-bg-secondary)', borderRight: '4px solid var(--color-border)', boxShadow: '4px 0 0 var(--color-border)' }}>
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
          className="flex select-none touch-none p-1 transition-colors duration-150 ease-out data-[orientation=vertical]:w-4 data-[orientation=horizontal]:flex-col data-[orientation=horizontal]:h-4"
          style={{ backgroundColor: 'var(--color-accent)', border: '2px solid var(--color-border)' }}
          orientation="vertical"
        >
          <ScrollArea.Thumb className="flex-1 relative before:content-[''] before:absolute before:top-1/2 before:left-1/2 before:-translate-x-1/2 before:-translate-y-1/2 before:w-full before:h-full before:min-w-[44px] before:min-h-[44px]" style={{ backgroundColor: 'var(--color-primary)', border: '2px solid var(--color-border)', borderRadius: '8px' }} />
        </ScrollArea.Scrollbar>
      </ScrollArea.Root>
      
      <div className="p-4" style={{ borderTop: '4px solid var(--color-border)', boxShadow: '0 -4px 0 var(--color-primary)' }}>
        <button
          onClick={onDisconnect}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200 font-black uppercase text-sm"
          style={{ 
            background: 'var(--color-primary)', 
            color: 'white',
            border: '3px solid var(--color-border)',
            boxShadow: '4px 4px 0 var(--color-border)',
            borderRadius: '12px',
            transform: 'rotate(-1deg)',
            textShadow: '2px 2px 0 var(--color-border)'
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.transform = 'rotate(-1deg) scale(1.05)'; 
            e.currentTarget.style.animation = 'comic-shake 0.3s ease-in-out';
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.transform = 'rotate(-1deg) scale(1)'; 
            e.currentTarget.style.animation = '';
          }}
        >
          <LogOut className="w-4 h-4" />
          <span>💥 EXIT!</span>
        </button>
      </div>
    </div>
  );
};
