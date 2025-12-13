// client/src/components/Sidebar/RoomList.tsx

import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Hash, Plus, X, LogIn } from 'lucide-react';

interface RoomListProps {
  allRooms: string[];
  myRooms: Set<string>;
  currentRoom: string | null;
  onRoomSelect: (room: string) => void;
  onJoinRoom: (room: string) => void;
  onLeaveRoom: (room: string) => void;
  onCreateRoom: (room: string) => void;
}

export const RoomList: React.FC<RoomListProps> = ({
  allRooms,
  myRooms,
  currentRoom,
  onRoomSelect,
  onJoinRoom,
  onLeaveRoom,
  onCreateRoom,
}) => {
  const [open, setOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      onCreateRoom(newRoomName.trim());
      setNewRoomName('');
      setOpen(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: 'var(--color-border)', textShadow: '2px 2px 0 var(--color-accent)' }}>🏠 ROOMS</h3>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="p-1.5 rounded-lg transition-all" style={{ backgroundColor: 'var(--color-secondary)', border: '2px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1) rotate(0deg)'; }}
            >
              <Plus className="w-4 h-4" style={{ color: 'white' }} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="bg-black/70 fixed inset-0 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 halftone-bg p-6 w-full max-w-md z-50 animate-comic-pop" style={{ backgroundColor: 'var(--color-bg-primary)', border: '4px solid var(--color-border)', borderRadius: '20px', boxShadow: '8px 8px 0 var(--color-border)', transform: 'rotate(-1deg)' }}>
              <Dialog.Title className="text-2xl font-black uppercase mb-4" style={{ color: 'var(--color-primary)', textShadow: '3px 3px 0 var(--color-border)' }}>
                💥 NEW ROOM!
              </Dialog.Title>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                placeholder="Type room name..."
                className="w-full px-4 py-3 mb-4 text-base font-bold" style={{ backgroundColor: 'white', border: '3px solid var(--color-border)', borderRadius: '12px', color: 'var(--color-text-primary)', boxShadow: '3px 3px 0 var(--color-border)' }}
                autoFocus
              />
              <div className="flex gap-3 justify-end">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 font-black uppercase text-sm transition-all" style={{ backgroundColor: '#9ca3af', color: 'white', border: '3px solid var(--color-border)', borderRadius: '10px', boxShadow: '3px 3px 0 var(--color-border)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    NOPE
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleCreateRoom}
                  className="px-4 py-2 font-black uppercase text-sm transition-all"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-border)', border: '3px solid var(--color-border)', borderRadius: '10px', boxShadow: '4px 4px 0 var(--color-border)', textShadow: '1px 1px 0 white' }}
                  onMouseEnter={(e) => { e.currentTarget.style.animation = 'kapow 0.3s ease-in-out'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.animation = ''; }}
                >
                  💥 CREATE!
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="space-y-2">
        {allRooms.map((room) => {
          const isJoined = myRooms.has(room);
          const isActive = currentRoom === room;

          return (
            <div
              key={room}
                className="flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                style={{
                  background: isActive ? 'var(--color-secondary)' : isJoined ? 'white' : 'transparent',
                  color: isActive ? 'white' : isJoined ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                  border: isActive || isJoined ? '2px solid var(--color-border)' : '2px dashed var(--color-border)',
                  boxShadow: isActive ? '3px 3px 0 var(--color-border)' : 'none',
                  transform: isActive ? 'rotate(-0.5deg)' : 'none'
                }}
                onMouseEnter={(e) => { if (isJoined && !isActive) { e.currentTarget.style.backgroundColor = 'var(--color-accent)'; e.currentTarget.style.transform = 'rotate(0.5deg) scale(1.02)'; } }}
                onMouseLeave={(e) => { if (isJoined && !isActive) { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.transform = 'none'; } }}
            >
              <button
                onClick={() => isJoined && onRoomSelect(room)}
                disabled={!isJoined}
                className="flex items-center gap-2 flex-1 text-left disabled:cursor-not-allowed font-bold"
              >
                <Hash className="w-4 h-4" />
                <span className="uppercase text-sm">{room}</span>
              </button>
              {!isJoined ? (
                <button
                  onClick={() => onJoinRoom(room)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ backgroundColor: 'var(--color-quaternary)', color: 'var(--color-border)', border: '2px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  title="Join room"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              ) : room !== 'general' ? (
                <button
                  onClick={() => onLeaveRoom(room)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white', border: '2px solid var(--color-border)', boxShadow: '2px 2px 0 var(--color-border)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.animation = 'comic-shake 0.3s ease-in-out'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.animation = ''; }}
                  title="Leave room"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
