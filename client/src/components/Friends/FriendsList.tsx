// client/src/components/Friends/FriendsList.tsx

import { useEffect, useState } from 'react';
import { MessageCircle, Trash2, UserMinus } from 'lucide-react';
import { friendService, Friend } from '../../services/friendService';
import { soundManager } from '../../services/SoundManager';

interface FriendsListProps {
  onSelectFriend: (friend: Friend) => void;
  selectedFriendId?: string;
  socket: any;
}

export function FriendsList({ onSelectFriend, selectedFriendId, socket }: FriendsListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  const loadFriends = async () => {
    try {
      const data = await friendService.getFriends();
      setFriends(data.friends);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFriends();
  }, []);

  // Listen for friend request accepted, removed, and status changes
  useEffect(() => {
    if (!socket) return;

    const handleFriendAdded = (data: any) => {
      soundManager.playReceive();
      loadFriends(); // Reload friends list
    };

    const handleFriendRemoved = (data: any) => {
      setFriends(prev => prev.filter(f => f.id !== data.userId));
    };

    const handleFriendStatusChanged = (data: { username: string; status: string }) => {
      console.log('Friend status changed:', data);
      setFriends(prev =>
        prev.map(f =>
          f.username === data.username
            ? { ...f, status: data.status, lastSeen: data.status === 'offline' ? new Date() : f.lastSeen }
            : f
        )
      );
    };

    socket.on('friend_request_accepted', handleFriendAdded);
    socket.on('friend_removed', handleFriendRemoved);
    socket.on('friend_status_changed', handleFriendStatusChanged);

    return () => {
      socket.off('friend_request_accepted', handleFriendAdded);
      socket.off('friend_removed', handleFriendRemoved);
      socket.off('friend_status_changed', handleFriendStatusChanged);
    };
  }, [socket]);

  const handleRemoveFriend = async (friendId: string) => {
    soundManager.playClick();
    try {
      await friendService.removeFriend(friendId);
      setFriends(prev => prev.filter(f => f.id !== friendId));
      setShowRemoveConfirm(null);

      // Notify via socket
      if (socket) {
        socket.emit('friend_removed', { friendId, userId: 'current-user-id' });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove friend');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center font-bold uppercase">LOADING FRIENDS... ⏳</div>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b-4 border-black">
        <h2 className="text-xl md:text-2xl font-black uppercase transform -rotate-1" style={{ fontFamily: 'Bangers' }}>
          👥 FRIENDS ({friends.length})
        </h2>
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 mx-3 mt-2 bg-red-500 text-white font-bold text-sm border-3 border-black rounded-md
                       shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          ⚠️ {error}
        </div>
      )}

      {/* Friends List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {friends.length === 0 ? (
          <div className="text-center py-8 text-gray-600 font-bold uppercase text-sm">
            NO FRIENDS YET! 😢
            <div className="text-xs mt-2">SEARCH FOR USERS TO ADD!</div>
          </div>
        ) : (
          friends.map((friend) => (
            <div
              key={friend.id}
              className={`flex items-center gap-2 p-2 border-3 border-black rounded-md 
                       shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[1px] hover:translate-y-[1px]
                       hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all
                       cursor-pointer ${
                         selectedFriendId === friend.username
                           ? 'bg-gradient-to-r from-yellow-300 to-pink-300'
                           : 'bg-gradient-to-r from-blue-200 to-purple-200'
                       }`}
              onClick={() => {
                soundManager.playClick();
                onSelectFriend(friend);
              }}
            >
              {/* Avatar with Status */}
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-purple-500 rounded-full border-3 border-black flex items-center justify-center
                              font-black text-white text-lg uppercase">
                  {friend.avatar || friend.username[0]}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-3 h-3 ${getStatusColor(friend.status)} 
                             rounded-full border-2 border-black`}
                />
              </div>

              {/* Friend Info */}
              <div className="flex-1 min-w-0">
                <div className="font-black uppercase text-sm truncate">{friend.displayName}</div>
                <div className="text-xs text-gray-700 truncate">@{friend.username}</div>
                {friend.status === 'offline' && friend.lastSeen && (
                  <div className="text-xs text-gray-600 truncate">
                    Last: {new Date(friend.lastSeen).toLocaleDateString()}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                {showRemoveConfirm === friend.id ? (
                  <>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="p-1 bg-red-600 text-white font-bold text-xs uppercase rounded border-2 border-black"
                      title="Confirm remove"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => setShowRemoveConfirm(null)}
                      className="p-1 bg-gray-400 text-white font-bold text-xs uppercase rounded border-2 border-black"
                      title="Cancel"
                    >
                      ✕
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowRemoveConfirm(friend.id)}
                    className="p-1.5 bg-red-500 text-white rounded-md border-2 border-black
                             hover:bg-red-600 transition-colors"
                    title="Remove friend"
                  >
                    <UserMinus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
