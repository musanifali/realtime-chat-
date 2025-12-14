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
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => handleTabChange('friends')}
          className={`flex-1 px-4 py-3 font-black uppercase rounded-md border-4 border-black
                     shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2
                     ${
                       activeTab === 'friends'
                         ? 'bg-yellow-400 text-black transform -rotate-1'
                         : 'bg-white text-gray-700 hover:bg-gray-100'
                     }`}
        >
          <Users className="w-5 h-5" />
          FRIENDS
        </button>

        <button
          onClick={() => handleTabChange('requests')}
          className={`flex-1 px-4 py-3 font-black uppercase rounded-md border-4 border-black
                     shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2
                     ${
                       activeTab === 'requests'
                         ? 'bg-yellow-400 text-black transform -rotate-1'
                         : 'bg-white text-gray-700 hover:bg-gray-100'
                     }`}
        >
          <Inbox className="w-5 h-5" />
          REQUESTS
        </button>

        <button
          onClick={() => handleTabChange('search')}
          className={`flex-1 px-4 py-3 font-black uppercase rounded-md border-4 border-black
                     shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-2
                     ${
                       activeTab === 'search'
                         ? 'bg-yellow-400 text-black transform -rotate-1'
                         : 'bg-white text-gray-700 hover:bg-gray-100'
                     }`}
        >
          <UserSearch className="w-5 h-5" />
          SEARCH
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
