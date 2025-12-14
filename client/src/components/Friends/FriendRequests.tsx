// client/src/components/Friends/FriendRequests.tsx

import { useEffect, useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { friendService, FriendRequest } from '../../services/friendService';
import { soundManager } from '../../services/SoundManager';

interface FriendRequestsProps {
  onRequestHandled: () => void;
  socket: any;
}

export function FriendRequests({ onRequestHandled, socket }: FriendRequestsProps) {
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      const data = await friendService.getPendingRequests();
      setRequests(data.requests);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // Listen for new friend requests
  useEffect(() => {
    if (!socket) return;

    const handleNewRequest = (data: any) => {
      // Only add if this is for the current user (check will be done by backend)
      // For now, we reload the list when any event is received
      loadRequests();
      soundManager.playReceive();
    };

    socket.on('friend_request_received', handleNewRequest);

    return () => {
      socket.off('friend_request_received', handleNewRequest);
    };
  }, [socket]);

  const handleAccept = async (friendshipId: string) => {
    soundManager.playSend();
    try {
      await friendService.acceptRequest(friendshipId);
      setRequests(prev => prev.filter(r => r.id !== friendshipId));
      onRequestHandled();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to accept request');
      soundManager.playClick();
    }
  };

  const handleReject = async (friendshipId: string) => {
    soundManager.playClick();
    try {
      await friendService.rejectRequest(friendshipId);
      setRequests(prev => prev.filter(r => r.id !== friendshipId));
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject request');
      soundManager.playClick();
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="text-center font-bold uppercase">LOADING REQUESTS... ⏳</div>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b-4 border-black">
        <h2 className="text-xl md:text-2xl font-black uppercase transform -rotate-1" style={{ fontFamily: 'Bangers' }}>
          📬 REQUESTS
        </h2>
        {requests.length > 0 && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-black rounded-full border-2 border-black
                         animate-pulse">
            {requests.length}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 mx-3 mt-2 bg-red-500 text-white font-bold text-sm border-3 border-black rounded-md
                       shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          ⚠️ {error}
        </div>
      )}

      {/* Requests List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-600 font-bold uppercase text-sm">
            NO PENDING REQUESTS! 😊
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-2 p-2 bg-gradient-to-r from-blue-200 to-purple-200 
                       border-3 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                       hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                       transition-all"
            >
              {/* Avatar */}
              <div className="w-10 h-10 bg-blue-500 rounded-full border-3 border-black flex items-center justify-center
                            font-black text-white text-lg uppercase flex-shrink-0">
                {request.requester.avatar || request.requester.username[0]}
              </div>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="font-black uppercase text-sm truncate">{request.requester.displayName}</div>
                <div className="text-xs text-gray-700 truncate">@{request.requester.username}</div>
                <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => handleAccept(request.id)}
                  className="p-2 bg-green-500 text-white font-black rounded-md border-2 border-black
                           shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                           hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  title="Accept"
                >
                  <Check className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  className="p-2 bg-red-500 text-white font-black rounded-md border-2 border-black
                           shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                           hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                  title="Reject"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
