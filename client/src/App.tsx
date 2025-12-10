// client/src/App.tsx
import { useState } from 'react';
import { Menu, X, Users } from 'lucide-react';
import { Login } from './components/Login/Login';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ChatArea } from './components/Chat/ChatArea';
import { MemberList } from './components/MemberList/MemberList';
import { useChatApp } from './hooks/useChatApp';
import { filterMessagesForTarget } from './utils/messageFilter';

function App() {
  const [input, setInput] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [showMobileMembers, setShowMobileMembers] = useState(false);
  
  const {
    isConnected,
    isConnecting,
    connectionError,
    username,
    setUsername,
    connect,
    disconnect,
    messages,
    chatTarget,
    setChatTarget,
    allRooms,
    myRooms,
    getRoomUsers,
    allUsers,
    chatService,
  } = useChatApp();

  // Send message
  const sendMessage = (): void => {
    if (!input.trim()) return;

    if (chatTarget.type === 'room') {
      chatService.sendRoomMessage(chatTarget.room, input.trim());
    } else {
      chatService.sendPrivateMessage(chatTarget.username, input.trim());
    }

    setInput('');
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      if (isConnected) sendMessage();
      else if (!isConnecting) connect();
    }
  };

  // Filter messages for current view
  const filteredMessages = filterMessagesForTarget(messages, chatTarget, username);

  // Get current room users
  const currentRoomUsers = chatTarget.type === 'room' 
    ? getRoomUsers(chatTarget.room)
    : [];

  // Login Screen
  if (!isConnected) {
    return (
      <Login
        username={username}
        isConnecting={isConnecting}
        connectionError={connectionError}
        onUsernameChange={setUsername}
        onConnect={connect}
        onKeyPress={handleKeyPress}
      />
    );
  }

  // Chat Screen
  return (
    <div className="flex h-screen text-gray-900" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Mobile Header with Menu Buttons */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 backdrop-blur-md" style={{ backgroundColor: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="p-2 rounded-lg transition-colors"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {showMobileSidebar ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        <h1 className="text-lg font-semibold">
          {chatTarget.type === 'room' ? `# ${chatTarget.room}` : `@ ${chatTarget.username}`}
        </h1>
        {chatTarget.type === 'room' && (
          <button
            onClick={() => setShowMobileMembers(!showMobileMembers)}
            className="p-2 hover:bg-[#3d3450] rounded-lg transition-colors relative"
          >
            <Users className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 text-xs rounded-full w-5 h-5 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%)', color: 'var(--color-text-on-primary)' }}>
              {currentRoomUsers.length}
            </span>
          </button>
        )}
        {chatTarget.type === 'user' && <div className="w-10" />}
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="md:hidden fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] z-50">
            <Sidebar
              username={username}
              allRooms={allRooms}
              myRooms={myRooms}
              allUsers={allUsers}
              currentRoom={chatTarget.type === 'room' ? chatTarget.room : null}
              currentUser={chatTarget.type === 'user' ? chatTarget.username : null}
              onRoomSelect={(room) => {
                setChatTarget({ type: 'room', room });
                setShowMobileSidebar(false);
              }}
              onUserSelect={(user) => {
                setChatTarget({ type: 'user', username: user });
                setShowMobileSidebar(false);
              }}
              onJoinRoom={(room) => chatService.joinRoom(room)}
              onLeaveRoom={(room) => chatService.leaveRoom(room)}
              onCreateRoom={(room) => chatService.createRoom(room)}
              onDisconnect={disconnect}
            />
          </div>
        </>
      )}

      {/* Mobile Members Overlay */}
      {showMobileMembers && chatTarget.type === 'room' && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMobileMembers(false)}
          />
          <div className="md:hidden fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] z-50">
            <MemberList
              members={currentRoomUsers}
              currentUsername={username}
              onMemberClick={(user) => {
                setChatTarget({ type: 'user', username: user });
                setShowMobileMembers(false);
              }}
            />
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 lg:w-80">
        <Sidebar
          username={username}
          allRooms={allRooms}
          myRooms={myRooms}
          allUsers={allUsers}
          currentRoom={chatTarget.type === 'room' ? chatTarget.room : null}
          currentUser={chatTarget.type === 'user' ? chatTarget.username : null}
          onRoomSelect={(room) => setChatTarget({ type: 'room', room })}
          onUserSelect={(user) => setChatTarget({ type: 'user', username: user })}
          onJoinRoom={(room) => chatService.joinRoom(room)}
          onLeaveRoom={(room) => chatService.leaveRoom(room)}
          onCreateRoom={(room) => chatService.createRoom(room)}
          onDisconnect={disconnect}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pt-0 pt-14">
        <ChatArea
          chatTarget={chatTarget}
          messages={filteredMessages}
          username={username}
          roomUsers={currentRoomUsers}
          input={input}
          onInputChange={setInput}
          onSendMessage={sendMessage}
          onKeyPress={handleKeyPress}
        />
      </div>

      {/* Desktop Member List */}
      {chatTarget.type === 'room' && (
        <div className="hidden lg:block w-64">
          <MemberList
            members={currentRoomUsers}
            currentUsername={username}
            onMemberClick={(user) => setChatTarget({ type: 'user', username: user })}
          />
        </div>
      )}
    </div>
  );
}

export default App;