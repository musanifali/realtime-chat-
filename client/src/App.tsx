// client/src/App.tsx
import { useState } from 'react';
import { Login } from './components/Login/Login';
import { DirectMessages } from './components/Sidebar/DirectMessages';
import { UserInfo } from './components/Sidebar/UserInfo';
import { ChatArea } from './components/Chat/ChatArea';
import { ThemeToggle } from './components/ThemeToggle/ThemeToggle';
import { useChatApp } from './hooks/useChatApp';
import { filterMessagesForTarget } from './utils/messageFilter';
import { LogOut, Menu, X } from 'lucide-react';

function App() {
  const [input, setInput] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  
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
    allUsers,
    chatService,
    socketService,
  } = useChatApp();

  // Send message
  const sendMessage = (): void => {
    if (!input.trim() || !chatTarget) return;
    chatService.sendPrivateMessage(chatTarget.username, input.trim());
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
  const filteredMessages = chatTarget 
    ? filterMessagesForTarget(messages, chatTarget, username)
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
    <div className="flex h-screen text-gray-900 relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}

      {/* Sidebar with user list */}
      <div 
        className={`
          w-64 lg:w-80 flex flex-col bendots-bg z-50
          fixed md:relative inset-y-0 left-0
          transform transition-transform duration-300 ease-in-out
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderRight: '4px solid var(--color-border)', boxShadow: '4px 0 0 var(--color-border)' }}
      >
        <UserInfo username={username} />
        
        <div className="flex-1 overflow-y-auto p-4">
          <DirectMessages
            allUsers={allUsers}
            currentUser={chatTarget?.username || null}
            onUserSelect={(user) => {
              setChatTarget({ type: 'user', username: user });
              setShowMobileSidebar(false);
            }}
          />
        </div>
        
        <div className="p-3 md:p-4" style={{ borderTop: '4px solid var(--color-border)', boxShadow: '0 -4px 0 var(--color-primary)' }}>
          <button
            onClick={disconnect}
            className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 transition-all duration-200 font-black uppercase text-xs md:text-sm"
            style={{ 
              background: 'var(--color-primary)', 
              color: 'white',
              border: '3px solid var(--color-border)',
              boxShadow: '4px 4px 0 var(--color-border)',
              borderRadius: '12px',
              transform: 'rotate(-1deg)',
              textShadow: '2px 2px 0 var(--color-border)'
            }}
            onMouseEnter={(e) => { 
              e.currentTarget.style.transform = 'rotate(-1deg) scale(1.05)'; 
              e.currentTarget.style.animation = 'comic-shake 0.3s ease-in-out';
            }}
            onMouseLeave={(e) => { 
              e.currentTarget.style.transform = 'rotate(-1deg) scale(1)'; 
              e.currentTarget.style.animation = '';
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>💥 EXIT!</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full md:w-auto">
        {/* Mobile Header with Hamburger */}
        <div className="md:hidden flex items-center p-4 gap-3" style={{ backgroundColor: 'var(--color-bg-secondary)', borderBottom: '4px solid var(--color-border)', boxShadow: '0 4px 0 var(--color-primary)' }}>
          <button
            onClick={() => setShowMobileSidebar(!showMobileSidebar)}
            className="p-2 transition-all duration-200"
            style={{ 
              background: 'var(--color-accent)', 
              border: '3px solid var(--color-border)',
              boxShadow: '3px 3px 0 var(--color-border)',
              borderRadius: '8px',
            }}
          >
            {showMobileSidebar ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-black uppercase" style={{ color: 'var(--color-primary)', textShadow: '2px 2px 0 var(--color-border)' }}>
              💬 CHAT!
            </h1>
          </div>
          <ThemeToggle />
        </div>

        <ChatArea
          chatTarget={chatTarget}
          messages={filteredMessages}
          username={username}
          input={input}
          onInputChange={setInput}
          onSendMessage={sendMessage}
          onKeyPress={handleKeyPress}
          socketService={socketService}
        />
      </div>
    </div>
  );
}

export default App;