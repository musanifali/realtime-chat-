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
    <div className="p-4 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-black uppercase transform -rotate-1" style={{ fontFamily: 'Bangers' }}>
          📬 FRIEND REQUESTS
        </h2>
        {requests.length > 0 && (
          <span className="px-3 py-1 bg-red-500 text-white font-black rounded-full border-2 border-black
                         animate-pulse">
            {requests.length}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500 text-white font-bold border-4 border-black rounded-md
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          ⚠️ {error}
        </div>
      )}

      {/* Requests List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-600 font-bold uppercase">
            NO PENDING REQUESTS! 😊
          </div>
        ) : (
          requests.map((request) => (
            <div
              key={request.id}
              className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-200 to-purple-200 
                       border-4 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                       transform hover:scale-[1.02] transition-transform"
            >
              {/* Avatar */}
              <div className="w-12 h-12 bg-blue-500 rounded-full border-4 border-black flex items-center justify-center
                            font-black text-white text-xl uppercase">
                {request.requester.avatar || request.requester.username[0]}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="font-black uppercase">{request.requester.displayName}</div>
                <div className="text-sm text-gray-700">@{request.requester.username}</div>
                <div className="text-xs text-gray-600 flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {new Date(request.createdAt).toLocaleDateString()}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(request.id)}
                  className="px-3 py-1 bg-green-500 text-white font-black uppercase rounded-md border-4 border-black
                           shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                           hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  ACCEPT!
                </button>
                <button
                  onClick={() => handleReject(request.id)}
                  className="px-3 py-1 bg-red-500 text-white font-black uppercase rounded-md border-4 border-black
                           shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                           hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  REJECT!
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
