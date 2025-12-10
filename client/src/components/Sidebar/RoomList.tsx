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
        <h3 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">Rooms</h3>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Trigger asChild>
            <button className="p-1 rounded transition-colors"
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <Plus className="w-4 h-4" style={{ color: 'var(--color-primary)' }} />
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="bg-black/50 fixed inset-0 z-50" />
            <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md z-50 border border-purple-200 shadow-2xl">
              <Dialog.Title className="text-lg font-semibold text-gray-900 mb-4">
                Create New Room
              </Dialog.Title>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
                placeholder="Enter room name..."
                className="w-full px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-400 mb-4"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <Dialog.Close asChild>
                  <button className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg transition-colors">
                    Cancel
                  </button>
                </Dialog.Close>
                <button
                  onClick={handleCreateRoom}
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all"
                >
                  Create
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      <div className="space-y-1">
        {allRooms.map((room) => {
          const isJoined = myRooms.has(room);
          const isActive = currentRoom === room;

          return (
            <div
              key={room}
                className="flex items-center justify-between px-3 py-2 rounded-lg transition-all"
                style={{
                  background: isActive ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' : 'transparent',
                  color: isActive ? 'var(--color-text-on-primary)' : isJoined ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                  boxShadow: isActive ? 'var(--shadow-md)' : 'none'
                }}
                onMouseEnter={(e) => { if (isJoined && !isActive) e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'; }}
                onMouseLeave={(e) => { if (isJoined && !isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <button
                onClick={() => isJoined && onRoomSelect(room)}
                disabled={!isJoined}
                className="flex items-center gap-2 flex-1 text-left disabled:cursor-not-allowed"
              >
                <Hash className="w-4 h-4" />
                <span className="font-medium">{room}</span>
              </button>
              {!isJoined ? (
                <button
                  onClick={() => onJoinRoom(room)}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--color-primary)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-surface-active)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
                  title="Join room"
                >
                  <LogIn className="w-4 h-4" />
                </button>
              ) : room !== 'general' ? (
                <button
                  onClick={() => onLeaveRoom(room)}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--color-error)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
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
