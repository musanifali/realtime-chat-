// client/src/components/Friends/UserSearch.tsx

import { useState } from 'react';
import { Search, UserPlus, Clock, Check, X, Ban } from 'lucide-react';
import { friendService, SearchResult } from '../../services/friendService';
import { soundManager } from '../../services/SoundManager';

interface UserSearchProps {
  onRequestSent: () => void;
}

export function UserSearch({ onRequestSent }: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError('');
    soundManager.playClick();

    try {
      const data = await friendService.searchUsers(query);
      setResults(data.users);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to search users');
      soundManager.playClick();
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId: string) => {
    soundManager.playClick();
    try {
      await friendService.sendRequest(userId);
      // Update results to reflect new status
      setResults(prev =>
        prev.map(user =>
          user.id === userId
            ? { ...user, friendshipStatus: 'pending' as const, isRequester: true }
            : user
        )
      );
      onRequestSent();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send request');
      soundManager.playClick();
    }
  };

  const getStatusButton = (user: SearchResult) => {
    if (user.friendshipStatus === 'accepted') {
      return (
        <button
          disabled
          className="px-3 py-1 bg-green-500 text-white rounded-md flex items-center gap-2 opacity-50 cursor-not-allowed"
        >
          <Check className="w-4 h-4" />
          FRIENDS!
        </button>
      );
    }

    if (user.friendshipStatus === 'pending') {
      if (user.isRequester) {
        return (
          <button
            disabled
            className="px-3 py-1 bg-yellow-400 text-black rounded-md flex items-center gap-2 opacity-50 cursor-not-allowed"
          >
            <Clock className="w-4 h-4" />
            SENT!
          </button>
        );
      } else {
        return (
          <button
            disabled
            className="px-3 py-1 bg-blue-500 text-white rounded-md flex items-center gap-2 opacity-50 cursor-not-allowed"
          >
            <Clock className="w-4 h-4" />
            PENDING
          </button>
        );
      }
    }

    if (user.friendshipStatus === 'blocked') {
      return (
        <button
          disabled
          className="px-3 py-1 bg-red-500 text-white rounded-md flex items-center gap-2 opacity-50 cursor-not-allowed"
        >
          <Ban className="w-4 h-4" />
          BLOCKED!
        </button>
      );
    }

    return (
      <button
        onClick={() => handleSendRequest(user.id)}
        className="px-3 py-1 bg-yellow-400 text-black font-bold rounded-md border-4 border-black 
                   shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                   hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-2
                   transform -rotate-1 hover:rotate-0"
      >
        <UserPlus className="w-4 h-4" />
        ADD!
      </button>
    );
  };

  return (
    <div className="p-4 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
      {/* Search Header */}
      <div className="mb-4">
        <h2 className="text-2xl font-black uppercase transform -rotate-1 mb-4" style={{ fontFamily: 'Bangers' }}>
          🔍 FIND FRIENDS!
        </h2>

        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search username..."
            className="flex-1 px-4 py-2 bg-yellow-100 border-4 border-black rounded-md font-bold 
                     uppercase placeholder:text-gray-600 focus:outline-none focus:ring-4 focus:ring-yellow-400"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white font-black uppercase rounded-md border-4 border-black
                     shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                     hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'SEARCHING...' : 'SEARCH!'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-500 text-white font-bold border-4 border-black rounded-md
                       shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transform -rotate-1">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {results.length === 0 && query && !loading && (
          <div className="text-center py-8 text-gray-600 font-bold uppercase">
            NO USERS FOUND! 😢
          </div>
        )}

        {results.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-3 p-3 bg-gradient-to-r from-pink-200 to-yellow-200 
                     border-4 border-black rounded-md shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                     transform hover:scale-[1.02] transition-transform"
          >
            {/* Avatar */}
            <div className="w-12 h-12 bg-purple-500 rounded-full border-4 border-black flex items-center justify-center
                          font-black text-white text-xl uppercase">
              {user.avatar || user.username[0]}
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="font-black uppercase">{user.displayName}</div>
              <div className="text-sm text-gray-700">@{user.username}</div>
              {user.bio && <div className="text-xs text-gray-600 mt-1">{user.bio}</div>}
            </div>

            {/* Action Button */}
            {getStatusButton(user)}
          </div>
        ))}
      </div>
    </div>
  );
}
