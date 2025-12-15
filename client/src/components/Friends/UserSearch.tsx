// client/src/components/Friends/UserSearch.tsx

import { useState } from 'react';
import { Search, UserPlus, Clock, Check, Ban } from 'lucide-react';
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
          className="px-2 py-1 bg-green-500 text-white text-xs rounded-md flex items-center gap-1 opacity-50 cursor-not-allowed border-2 border-black whitespace-nowrap flex-shrink-0"
        >
          <Check className="w-3 h-3" />
          FRIENDS
        </button>
      );
    }

    if (user.friendshipStatus === 'pending') {
      if (user.isRequester) {
        return (
          <button
            disabled
            className="px-2 py-1 bg-yellow-400 text-black text-xs rounded-md flex items-center gap-1 opacity-50 cursor-not-allowed border-2 border-black whitespace-nowrap flex-shrink-0"
          >
            <Clock className="w-3 h-3" />
            SENT
          </button>
        );
      } else {
        return (
          <button
            disabled
            className="px-2 py-1 bg-blue-500 text-white text-xs rounded-md flex items-center gap-1 opacity-50 cursor-not-allowed border-2 border-black whitespace-nowrap flex-shrink-0"
          >
            <Clock className="w-3 h-3" />
            PENDING
          </button>
        );
      }
    }

    if (user.friendshipStatus === 'blocked') {
      return (
        <button
          disabled
          className="px-2 py-1 bg-red-500 text-white text-xs rounded-md flex items-center gap-1 opacity-50 cursor-not-allowed border-2 border-black whitespace-nowrap flex-shrink-0"
        >
          <Ban className="w-3 h-3" />
          BLOCKED
        </button>
      );
    }

    return (
      <button
        onClick={() => handleSendRequest(user.id)}
        className="px-2 py-1 bg-yellow-400 text-black font-bold text-xs rounded-md border-2 border-black 
                   shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                   hover:translate-x-[1px] hover:translate-y-[1px] transition-all flex items-center gap-1
                   whitespace-nowrap flex-shrink-0"
      >
        <UserPlus className="w-3 h-3" />
        ADD!
      </button>
    );
  };

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full flex flex-col overflow-hidden">
      {/* Search Header */}
      <div className="p-3 border-b-4 border-black flex-shrink-0">
        <h2 className="text-xl md:text-2xl font-black uppercase transform -rotate-1 mb-3" style={{ fontFamily: 'Bangers' }}>
          🔍 FIND FRIENDS!
        </h2>

        {/* Search Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search..."
            className="flex-1 px-3 py-2 text-sm bg-yellow-100 border-3 border-black rounded-md font-bold 
                     uppercase placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 min-w-0"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-3 py-2 bg-blue-500 text-white font-black uppercase text-xs sm:text-sm rounded-md border-3 border-black
                     shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                     hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 flex-shrink-0 whitespace-nowrap"
          >
            <Search className="w-4 h-4 flex-shrink-0" />
            <span>{loading ? 'SEARCHING...' : 'SEARCH!'}</span>
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="p-2 mx-3 mt-2 bg-red-500 text-white font-bold text-sm border-3 border-black rounded-md
                       shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
          ⚠️ {error}
        </div>
      )}

      {/* Results */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">
        {results.length === 0 && query && !loading && (
          <div className="text-center py-8 text-gray-600 font-bold uppercase text-sm">
            NO USERS FOUND! 😢
          </div>
        )}

        {results.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 p-2 bg-gradient-to-r from-pink-200 to-yellow-200 
                     border-3 border-black rounded-md shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                     hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                     transition-all"
          >
            {/* Avatar */}
            <div className="w-10 h-10 bg-purple-500 rounded-full border-3 border-black flex items-center justify-center
                          font-black text-white text-lg uppercase flex-shrink-0">
              {user.avatar || user.username[0]}
            </div>

            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="font-black uppercase text-sm truncate">{user.displayName}</div>
              <div className="text-xs text-gray-700 truncate">@{user.username}</div>
              {user.bio && <div className="text-xs text-gray-600 mt-1 truncate">{user.bio}</div>}
            </div>

            {/* Action Button */}
            {getStatusButton(user)}
          </div>
        ))}
      </div>
    </div>
  );
}
