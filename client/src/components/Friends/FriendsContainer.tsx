// client/src/components/Friends/FriendsContainer.tsx

import { useState } from 'react';
import { UserSearch, Users, Inbox } from 'lucide-react';
import { FriendsList } from './FriendsList';
import { FriendRequests } from './FriendRequests';
import { UserSearch as UserSearchComponent } from './UserSearch';
import { soundManager } from '../../services/SoundManager';

interface FriendsContainerProps {
  onSelectFriend: (friend: any) => void;
  selectedFriendId?: string;
  socket: any;
}

type Tab = 'friends' | 'requests' | 'search';

export function FriendsContainer({ onSelectFriend, selectedFriendId, socket }: FriendsContainerProps) {
  const [activeTab, setActiveTab] = useState<Tab>('friends');

  const handleTabChange = (tab: Tab) => {
    soundManager.playClick();
    setActiveTab(tab);
  };

  const handleRequestHandled = () => {
    // Switch back to friends tab after handling request
    setActiveTab('friends');
  };

  const handleRequestSent = () => {
    // Stay on search tab or switch to friends
    // For now, just play sound
    soundManager.playSend();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex gap-1 mb-2">
        <button
          onClick={() => handleTabChange('friends')}
          className={`flex-1 px-2 py-2 font-black uppercase text-xs rounded-md border-3 border-black
                     shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1
                     ${
                       activeTab === 'friends'
                         ? 'bg-yellow-400 text-black'
                         : 'bg-white text-gray-700 hover:bg-gray-100'
                     }`}
        >
          <Users className="w-4 h-4" />
          <span className="hidden sm:inline">FRIENDS</span>
        </button>

        <button
          onClick={() => handleTabChange('requests')}
          className={`flex-1 px-2 py-2 font-black uppercase text-xs rounded-md border-3 border-black
                     shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1
                     ${
                       activeTab === 'requests'
                         ? 'bg-yellow-400 text-black'
                         : 'bg-white text-gray-700 hover:bg-gray-100'
                     }`}
        >
          <Inbox className="w-4 h-4" />
          <span className="hidden sm:inline">REQUESTS</span>
        </button>

        <button
          onClick={() => handleTabChange('search')}
          className={`flex-1 px-2 py-2 font-black uppercase text-xs rounded-md border-3 border-black
                     shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-1
                     ${
                       activeTab === 'search'
                         ? 'bg-yellow-400 text-black'
                         : 'bg-white text-gray-700 hover:bg-gray-100'
                     }`}
        >
          <UserSearch className="w-4 h-4" />
          <span className="hidden sm:inline">SEARCH</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'friends' && (
          <FriendsList
            onSelectFriend={onSelectFriend}
            selectedFriendId={selectedFriendId}
            socket={socket}
          />
        )}

        {activeTab === 'requests' && (
          <FriendRequests onRequestHandled={handleRequestHandled} socket={socket} />
        )}

        {activeTab === 'search' && <UserSearchComponent onRequestSent={handleRequestSent} />}
      </div>
    </div>
  );
}
