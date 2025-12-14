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

  // Listen for friend request accepted
  useEffect(() => {
    if (!socket) return;

    const handleFriendAdded = (data: any) => {
      soundManager.playReceive();
      loadFriends(); // Reload friends list
    };

    const handleFriendRemoved = (data: any) => {
      setFriends(prev => prev.filter(f => f.id !== data.userId));
    };

    socket.on('friend_request_accepted', handleFriendAdded);
    socket.on('friend_removed', handleFriendRemoved);

    return () => {
      socket.off('friend_request_accepted', handleFriendAdded);
      socket.off('friend_removed', handleFriendRemoved);
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
    <div className="p-4 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Header */}
      <h2 className="text-2xl font-black uppercase transform -rotate-1 mb-4" style={{ fontFamily: 'Bangers' }}>
        👥 MY FRIENDS ({friends.length})
      </h2>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500 text-white font-bold border-4 border-black rounded-md
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          ⚠️ {error}
        </div>
      )}

      {/* Friends List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {friends.length === 0 ? (
          <div className="text-center py-8 text-gray-600 font-bold uppercase">
            NO FRIENDS YET! 😢
            <div className="text-sm mt-2">SEARCH FOR USERS TO ADD!</div>
          </div>
        ) : (
          friends.map((friend) => (
            <div
              key={friend.id}
              className={`flex items-center gap-3 p-3 border-4 border-black rounded-md 
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform hover:scale-[1.02] transition-all
                       cursor-pointer ${
                         selectedFriendId === friend.id
                           ? 'bg-gradient-to-r from-yellow-300 to-pink-300'
                           : 'bg-gradient-to-r from-blue-200 to-purple-200'
                       }`}
              onClick={() => {
                soundManager.playClick();
                onSelectFriend(friend);
              }}
            >
              {/* Avatar with Status */}
              <div className="relative">
                <div className="w-12 h-12 bg-purple-500 rounded-full border-4 border-black flex items-center justify-center
                              font-black text-white text-xl uppercase">
                  {friend.avatar || friend.username[0]}
                </div>
                <div
                  className={`absolute bottom-0 right-0 w-4 h-4 ${getStatusColor(friend.status)} 
                             rounded-full border-2 border-black`}
                />
              </div>

              {/* Friend Info */}
              <div className="flex-1">
                <div className="font-black uppercase">{friend.displayName}</div>
                <div className="text-sm text-gray-700">@{friend.username}</div>
                {friend.status === 'offline' && friend.lastSeen && (
                  <div className="text-xs text-gray-600">
                    Last seen: {new Date(friend.lastSeen).toLocaleString()}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                {showRemoveConfirm === friend.id ? (
                  <>
                    <button
                      onClick={() => handleRemoveFriend(friend.id)}
                      className="px-2 py-1 bg-red-600 text-white font-bold text-xs uppercase rounded border-2 border-black"
                    >
                      CONFIRM
                    </button>
                    <button
                      onClick={() => setShowRemoveConfirm(null)}
                      className="px-2 py-1 bg-gray-400 text-white font-bold text-xs uppercase rounded border-2 border-black"
                    >
                      CANCEL
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowRemoveConfirm(friend.id)}
                    className="p-2 bg-red-500 text-white rounded-md border-2 border-black
                             hover:bg-red-600 transition-colors"
                    title="Remove friend"
                  >
                    <UserMinus className="w-4 h-4" />
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
