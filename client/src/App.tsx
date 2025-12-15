// client/src/App.tsx
import { useState, useEffect } from 'react';
import { AuthContainer } from './components/Auth/AuthContainer';
import { FriendsContainer } from './components/Friends/FriendsContainer';
import { UserInfo } from './components/Sidebar/UserInfo';
import { ChatArea } from './components/Chat/ChatArea';
import { SoundToggle } from './components/SoundToggle/SoundToggle';
import { NotificationToggle } from './components/NotificationToggle/NotificationToggle';
import { InstallPrompt } from './components/PWA/InstallPrompt';
import { UpdatePrompt } from './components/PWA/UpdatePrompt';
import { ToastContainer } from './components/Toast/Toast';
import { useChatApp } from './hooks/useChatApp';
import { filterMessagesForTarget } from './utils/messageFilter';
import { LogOut } from 'lucide-react';
import { soundManager } from './services/SoundManager';
import { authService } from './services/authService';
import { pushNotificationService } from './services/PushNotificationService';

function App() {
  const [input, setInput] = useState('');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  const {
    isConnected,
    isConnecting,
    username,
    setUsername,
    connect,
    disconnect,
    messages,
    addMessage,
    chatTarget,
    setChatTarget,
    loadHistory,
    chatService,
    socketService,
    getUnreadCount,
  } = useChatApp();

  // Setup global socket listeners when authenticated
  useEffect(() => {
    if (!isAuthenticated || !username) return;

    const socket = socketService.getSocket();
    if (!socket) return;

    console.log('🔗 Setting up global socket listeners for:', username);

    // This keeps socket active and listening even when not in DM view
    const handleConnect = () => {
      console.log('🟢 Socket connected globally');
    };

    socket.on('connect', handleConnect);

    return () => {
      socket.off('connect', handleConnect);
    };
  }, [isAuthenticated, username, socketService]);

  // Check if user is already authenticated
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Only check auth if we have a token in localStorage
        const token = authService.getAccessToken();
        if (!token) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          return;
        }

        const user = await authService.getMe();
        setIsAuthenticated(true);
        setUsername(user.username);
        // Auto-connect to socket with JWT immediately
        setTimeout(() => connect(), 100);
        // Initialize push notifications to maintain subscriptions
        setTimeout(() => {
          pushNotificationService.initialize().then((hasSubscription) => {
            console.log('🔔 Push notification status:', hasSubscription ? 'active' : 'inactive');
          });
        }, 200);
      } catch (error) {
        // Clear invalid token and set to unauthenticated
        authService.logout();
        setIsAuthenticated(false);
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuth();
  }, []);

  // Handle auth success
  const handleAuthSuccess = async () => {
    try {
      const user = await authService.getMe();
      setIsAuthenticated(true);
      setUsername(user.username);
      // Connect to socket with JWT after state updates
      setTimeout(() => {
        console.log('🔗 Connecting socket after login for user:', user.username);
        connect();
      }, 100);
    } catch (error) {
      console.error('Failed to get user info:', error);
    }
  };

  // Send message
  const sendMessage = (): void => {
    if (!input.trim() || !chatTarget) return;
    
    const messageText = input.trim();
    const tempId = `temp_${Date.now()}_${Math.random()}`;
    
    // Optimistically add sent message to UI immediately with temp ID
    addMessage('private_sent', messageText, `To ${chatTarget.username}`, chatTarget.username, tempId);
    
    // Send via socket with tempId for acknowledgment matching
    chatService.sendPrivateMessage(chatTarget.username, messageText, tempId);
    setInput('');
  };

  // Send voice message
  const sendVoiceMessage = (_audioBlob: Blob, duration: number, effect?: 'normal' | 'robot' | 'echo' | 'chipmunk'): void => {
    if (!chatTarget) return;
    
    // For now, send as text message - in production, you'd upload the audio to server
    // and send the URL/metadata
    const voiceText = `🎤 Voice Message (${duration}s) ${effect === 'robot' ? '🤖' : effect === 'echo' ? '🔊' : effect === 'chipmunk' ? '🐿️' : '🎵'}`;
    chatService.sendPrivateMessage(chatTarget.username, voiceText);
    
    // Note: Voice data is not persisted - in production implementation:
    // 1. Upload audioBlob to server/storage
    // 2. Send message with audio URL and metadata
    // 3. Receiver downloads and plays the audio with effects
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      if (isConnected) sendMessage();
      else if (!isConnecting) connect();
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setIsExiting(true);
    soundManager.playClick();
    
    try {
      await authService.logout();
      disconnect();
      setIsAuthenticated(false);
      setUsername('');
      setTimeout(() => setIsExiting(false), 300);
    } catch (error) {
      console.error('Logout error:', error);
      setIsExiting(false);
    }
  };

  // Filter messages for current view
  const filteredMessages = chatTarget 
    ? filterMessagesForTarget(messages, chatTarget, username)
    : [];

  // Show loading spinner while checking auth
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
        <div className="text-center">
          <div className="text-4xl font-black animate-pulse" style={{ color: 'var(--color-primary)' }}>
            💥 LOADING... 💥
          </div>
        </div>
      </div>
    );
  }

  // Auth Screen (Login/Register)
  if (!isAuthenticated) {
    return <AuthContainer onAuthSuccess={handleAuthSuccess} />;
  }

  // Chat Screen
  return (
    <div className="flex h-screen max-h-screen text-gray-900 relative overflow-hidden w-full" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
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
          w-full sm:w-80 md:w-64 lg:w-80 flex flex-col bendots-bg z-50
          fixed md:relative inset-y-0 left-0
          transform transition-transform duration-300 ease-in-out
          ${showMobileSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ backgroundColor: 'var(--color-bg-secondary)', borderRight: '4px solid var(--color-border)', boxShadow: '4px 0 0 var(--color-border)' }}
      >
        <UserInfo username={username} />
        
        <div className="flex-1 min-h-0 overflow-hidden p-2 md:p-4">
          <FriendsContainer
            onSelectFriend={(friend) => {
              setChatTarget({ type: 'user', username: friend.username });
              setShowMobileSidebar(false);
            }}
            selectedFriendId={chatTarget?.username}
            socket={socketService.getSocket()}
            getUnreadCount={getUnreadCount}
          />
        </div>
        
        <div className="p-3 md:p-4 space-y-3" style={{ borderTop: '4px solid var(--color-border)', boxShadow: '0 -4px 0 var(--color-primary)' }}>
          {/* Toggles Row */}
          <div className="flex gap-2 justify-center">
            <SoundToggle />
            <NotificationToggle />
          </div>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-3 transition-all duration-200 font-black uppercase text-xs md:text-sm ${isExiting ? 'animate-pulse' : ''}`}
            style={{ 
              background: 'var(--color-primary)', 
              color: 'white',
              border: '3px solid var(--color-border)',
              boxShadow: isExiting ? '2px 2px 0 var(--color-border)' : '4px 4px 0 var(--color-border)',
              borderRadius: '12px',
              transform: isExiting ? 'rotate(-1deg) scale(0.95)' : 'rotate(-1deg)',
              textShadow: '2px 2px 0 var(--color-border)'
            }}
            onMouseEnter={(e) => { 
              if (!isExiting) {
                e.currentTarget.style.transform = 'rotate(-1deg) scale(1.05)'; 
                e.currentTarget.style.animation = 'comic-shake 0.3s ease-in-out';
              }
            }}
            onMouseLeave={(e) => { 
              if (!isExiting) {
                e.currentTarget.style.transform = 'rotate(-1deg) scale(1)'; 
                e.currentTarget.style.animation = '';
              }
            }}
          >
            <LogOut className="w-4 h-4" />
            <span>💥 LOGOUT!</span>
          </button>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 w-full md:w-auto">
        <ChatArea
          chatTarget={chatTarget}
          messages={filteredMessages}
          username={username}
          input={input}
          onInputChange={setInput}
          onSendMessage={sendMessage}
          onSendVoice={sendVoiceMessage}
          onKeyPress={handleKeyPress}
          socketService={socketService}
          onLoadHistory={loadHistory}
          onToggleSidebar={() => {
            soundManager.playClick();
            setShowMobileSidebar(!showMobileSidebar);
          }}
        />
      </div>

      {/* PWA Components */}
      <InstallPrompt />
      <UpdatePrompt />
      
      {/* In-app Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default App;