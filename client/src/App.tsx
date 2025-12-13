// client/src/App.tsx
import { useState } from 'react';
import { Login } from './components/Login/Login';
import { DirectMessages } from './components/Sidebar/DirectMessages';
import { UserInfo } from './components/Sidebar/UserInfo';
import { ChatArea } from './components/Chat/ChatArea';
import { useChatApp } from './hooks/useChatApp';
import { filterMessagesForTarget } from './utils/messageFilter';
import { LogOut } from 'lucide-react';

function App() {
  const [input, setInput] = useState('');
  
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
    <div className="flex h-screen text-gray-900" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Sidebar with user list */}
      <div className="w-64 lg:w-80 flex flex-col bendots-bg" style={{ backgroundColor: 'var(--color-bg-secondary)', borderRight: '4px solid var(--color-border)', boxShadow: '4px 0 0 var(--color-border)' }}>
        <UserInfo username={username} />
        
        <div className="flex-1 overflow-y-auto p-4">
          <DirectMessages
            allUsers={allUsers}
            currentUser={chatTarget?.username || null}
            onUserSelect={(user) => setChatTarget({ type: 'user', username: user })}
          />
        </div>
        
        <div className="p-4" style={{ borderTop: '4px solid var(--color-border)', boxShadow: '0 -4px 0 var(--color-primary)' }}>
          <button
            onClick={disconnect}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 transition-all duration-200 font-black uppercase text-sm"
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
      <div className="flex-1 flex flex-col min-w-0">
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