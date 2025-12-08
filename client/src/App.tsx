// client/src/App.tsx
import { useState, useRef, useEffect } from 'react';

// ============================================
// Types
// ============================================

type ClientMessage = 
  | { type: 'register'; username: string }
  | { type: 'message'; message: string }
  | { type: 'private_message'; to: string; message: string };

type ServerMessage = 
  | { type: 'broadcast'; username: string; message: string }
  | { type: 'private'; from: string; to: string; message: string }
  | { type: 'user_list'; users: string[] }
  | { type: 'system'; message: string };

interface ChatMessage {
  type: 'sent' | 'received' | 'system' | 'private_sent' | 'private_received';
  username?: string;
  text: string;
  timestamp: Date;
}

// ============================================
// Component
// ============================================

function App() {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [serverPort, setServerPort] = useState<string>('4001');
  const [connectionError, setConnectionError] = useState<string>('');

  // Refs
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Add message helper
  const addMessage = (
    type: ChatMessage['type'], 
    text: string, 
    username?: string
  ): void => {
    setMessages(prev => [...prev, {
      type,
      text,
      username,
      timestamp: new Date()
    }]);
  };

  // Connect to server
  const connect = (): void => {
    if (!username.trim()) {
      setConnectionError('Please enter a username');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');

    const socket = new WebSocket(`ws://localhost:${serverPort}`);
    socketRef.current = socket;

    // Connection opened
    socket.onopen = (): void => {
      console.log(`Connected to server on port ${serverPort}`);
      
      // Send registration
      const registerMessage: ClientMessage = {
        type: 'register',
        username: username.trim()
      };
      socket.send(JSON.stringify(registerMessage));
    };

    // Message received
    socket.onmessage = (event: MessageEvent): void => {
      const data: ServerMessage = JSON.parse(event.data);
      console.log('Received:', data);

      // Handle user list
      if (data.type === 'user_list') {
        // Filter out our own username
        setOnlineUsers(data.users.filter(u => u !== username));
        
        // If this is first user_list, we're fully connected
        if (!isConnected) {
          setIsConnected(true);
          setIsConnecting(false);
          addMessage('system', 'Connected to chat!');
        }
        return;
      }

      // Handle system message
      if (data.type === 'system') {
        // Check if username taken
        if (data.message.includes('already taken')) {
          setConnectionError(data.message);
          setIsConnecting(false);
          return;
        }
        addMessage('system', data.message);
        return;
      }

      // Handle broadcast message
      if (data.type === 'broadcast') {
        const isMine = data.username === username;
        addMessage(
          isMine ? 'sent' : 'received',
          data.message,
          data.username
        );
        return;
      }

      // Handle private message
      if (data.type === 'private') {
        const isSentByMe = data.from === username;
        addMessage(
          isSentByMe ? 'private_sent' : 'private_received',
          data.message,
          isSentByMe ? `To ${data.to}` : `From ${data.from}`
        );
        return;
      }
    };

    // Connection closed
    socket.onclose = (): void => {
      console.log('Disconnected from server');
      
      if (isConnected) {
        addMessage('system', 'Disconnected from server');
      }
      
      setIsConnected(false);
      setIsConnecting(false);
      setOnlineUsers([]);
      socketRef.current = null;
    };

    // Connection error
    socket.onerror = (error: Event): void => {
      console.error('WebSocket error:', error);
      setConnectionError(`Could not connect to server on port ${serverPort}`);
      setIsConnecting(false);
    };
  };

  // Disconnect from server
  const disconnect = (): void => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  // Send message
  const sendMessage = (): void => {
    if (!input.trim() || !socketRef.current) return;

    let message: ClientMessage;

    if (selectedUser) {
      // Private message
      message = {
        type: 'private_message',
        to: selectedUser,
        message: input.trim()
      };
    } else {
      // Broadcast message
      message = {
        type: 'message',
        message: input.trim()
      };
    }

    socketRef.current.send(JSON.stringify(message));
    setInput('');
  };

  // Handle Enter key
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      if (isConnected) {
        sendMessage();
      } else if (!isConnecting) {
        connect();
      }
    }
  };

  // Format timestamp
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ============================================
  // Render: Login Screen
  // ============================================

  if (!isConnected) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>💬 Real-Time Chat</h1>
          <p style={styles.loginSubtitle}>Connect to start chatting</p>

          {/* Server Selection */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Server</label>
            <select
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              style={styles.select}
              disabled={isConnecting}
            >
              <option value="4001">Server 1 (Port 4001)</option>
              <option value="4002">Server 2 (Port 4002)</option>
            </select>
          </div>

          {/* Username Input */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your username..."
              style={styles.input}
              disabled={isConnecting}
              autoFocus
            />
          </div>

          {/* Error Message */}
          {connectionError && (
            <div style={styles.error}>
              ⚠️ {connectionError}
            </div>
          )}

          {/* Connect Button */}
          <button
            onClick={connect}
            style={{
              ...styles.button,
              ...(isConnecting ? styles.buttonDisabled : {})
            }}
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Join Chat'}
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // Render: Chat Screen
  // ============================================

  return (
    <div style={styles.chatContainer}>
      
      {/* Sidebar */}
      <div style={styles.sidebar}>
        {/* User Info */}
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={styles.userName}>{username}</div>
            <div style={styles.serverInfo}>Server {serverPort}</div>
          </div>
        </div>

        {/* Online Users */}
        <div style={styles.onlineSection}>
          <h3 style={styles.sidebarTitle}>Online Users</h3>

          {/* Everyone Option */}
          <div
            onClick={() => setSelectedUser(null)}
            style={{
              ...styles.userItem,
              ...(selectedUser === null ? styles.userItemSelected : {})
            }}
          >
            <span>📢</span>
            <span>Everyone</span>
          </div>

          {/* User List */}
          {onlineUsers.length > 0 ? (
            onlineUsers.map((user) => (
              <div
                key={user}
                onClick={() => setSelectedUser(user)}
                style={{
                  ...styles.userItem,
                  ...(selectedUser === user ? styles.userItemSelected : {})
                }}
              >
                <span>👤</span>
                <span>{user}</span>
              </div>
            ))
          ) : (
            <div style={styles.noUsers}>No other users online</div>
          )}
        </div>

        {/* Disconnect Button */}
        <button onClick={disconnect} style={styles.disconnectButton}>
          Disconnect
        </button>
      </div>

      {/* Main Chat Area */}
      <div style={styles.mainChat}>
        {/* Chat Header */}
        <div style={styles.chatHeader}>
          <h2 style={styles.chatTitle}>
            {selectedUser ? `Chat with ${selectedUser}` : 'Public Chat'}
          </h2>
          {selectedUser && (
            <span style={styles.privateIndicator}>🔒 Private</span>
          )}
        </div>

        {/* Messages */}
        <div style={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                ...styles.messageWrapper,
                justifyContent: 
                  msg.type === 'sent' || msg.type === 'private_sent'
                    ? 'flex-end'
                    : msg.type === 'system'
                    ? 'center'
                    : 'flex-start'
              }}
            >
              <div
                style={{
                  ...styles.message,
                  ...(msg.type === 'sent' ? styles.messageSent : {}),
                  ...(msg.type === 'received' ? styles.messageReceived : {}),
                  ...(msg.type === 'private_sent' ? styles.messagePrivateSent : {}),
                  ...(msg.type === 'private_received' ? styles.messagePrivateReceived : {}),
                  ...(msg.type === 'system' ? styles.messageSystem : {})
                }}
              >
                {msg.type !== 'system' && msg.username && (
                  <div style={styles.messageUsername}>
                    {msg.username}
                    {(msg.type === 'private_sent' || msg.type === 'private_received') && ' 🔒'}
                  </div>
                )}
                <div style={styles.messageText}>{msg.text}</div>
                <div style={styles.messageTime}>{formatTime(msg.timestamp)}</div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={styles.inputArea}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedUser
                ? `Private message to ${selectedUser}...`
                : 'Message everyone...'
            }
            style={styles.messageInput}
            autoFocus
          />
          <button onClick={sendMessage} style={styles.sendButton}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Styles
// ============================================

const styles: { [key: string]: React.CSSProperties } = {
  // Login Screen
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f0f2f5',
    padding: '20px',
    boxSizing: 'border-box'
  },
  loginBox: {
    backgroundColor: '#fff',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  loginTitle: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    textAlign: 'center'
  },
  loginSubtitle: {
    margin: '0 0 30px 0',
    color: '#666',
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    color: '#333'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
    outline: 'none'
  },
  select: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#fff'
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#007bff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c00',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },

  // Chat Screen
  chatContainer: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#f0f2f5'
  },

  // Sidebar
  sidebar: {
    width: '280px',
    backgroundColor: '#fff',
    borderRight: '1px solid #ddd',
    display: 'flex',
    flexDirection: 'column'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    borderBottom: '1px solid #eee'
  },
  avatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: '#007bff',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: '600'
  },
  userName: {
    fontWeight: '600',
    fontSize: '16px'
  },
  serverInfo: {
    fontSize: '12px',
    color: '#666'
  },
  onlineSection: {
    flex: 1,
    padding: '15px',
    overflowY: 'auto'
  },
  sidebarTitle: {
    margin: '0 0 15px 0',
    fontSize: '14px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    marginBottom: '4px',
    backgroundColor: '#f5f5f5'
  },
  userItemSelected: {
    backgroundColor: '#007bff',
    color: '#fff'
  },
  noUsers: {
    color: '#999',
    fontSize: '14px',
    padding: '10px'
  },
  disconnectButton: {
    margin: '15px',
    padding: '12px',
    backgroundColor: '#dc3545',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '500'
  },

  // Main Chat
  mainChat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '20px',
    backgroundColor: '#fff',
    borderBottom: '1px solid #ddd'
  },
  chatTitle: {
    margin: 0,
    fontSize: '18px'
  },
  privateIndicator: {
    fontSize: '12px',
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: '4px 8px',
    borderRadius: '4px'
  },

  // Messages
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px'
  },
  messageWrapper: {
    display: 'flex',
    marginBottom: '12px'
  },
  message: {
    maxWidth: '70%',
    padding: '10px 14px',
    borderRadius: '12px'
  },
  messageSent: {
    backgroundColor: '#007bff',
    color: '#fff'
  },
  messageReceived: {
    backgroundColor: '#fff',
    border: '1px solid #ddd'
  },
  messagePrivateSent: {
    backgroundColor: '#6f42c1',
    color: '#fff'
  },
  messagePrivateReceived: {
    backgroundColor: '#e9d5ff',
    border: '1px solid #c9a9eb'
  },
  messageSystem: {
    backgroundColor: '#f0f0f0',
    color: '#666',
    fontSize: '13px',
    padding: '8px 16px'
  },
  messageUsername: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
    opacity: 0.8
  },
  messageText: {
    wordBreak: 'break-word'
  },
  messageTime: {
    fontSize: '10px',
    opacity: 0.7,
    marginTop: '4px',
    textAlign: 'right'
  },

  // Input Area
  inputArea: {
    display: 'flex',
    gap: '10px',
    padding: '20px',
    backgroundColor: '#fff',
    borderTop: '1px solid #ddd'
  },
  messageInput: {
    flex: 1,
    padding: '14px',
    fontSize: '15px',
    border: '1px solid #ddd',
    borderRadius: '24px',
    outline: 'none'
  },
  sendButton: {
    padding: '14px 28px',
    backgroundColor: '#007bff',
    color: '#fff',
    border: 'none',
    borderRadius: '24px',
    cursor: 'pointer',
    fontWeight: '600'
  }
};

export default App;