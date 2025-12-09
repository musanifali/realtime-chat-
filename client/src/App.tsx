// client/src/App.tsx
import { useState, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

// ============================================
// Configuration
// ============================================

const SERVER_URL = 'http://13.49.78.104';

// ============================================
// Types
// ============================================

interface ServerToClientEvents {
  room_message: (data: { room: string; username: string; message: string }) => void;
  private_message: (data: { from: string; to: string; message: string }) => void;
  room_list: (rooms: string[]) => void;
  room_users: (data: { room: string; users: string[] }) => void;
  user_list: (users: string[]) => void;
  system: (message: string) => void;
  room_system: (data: { room: string; message: string }) => void;
  error: (message: string) => void;
  joined_room: (room: string) => void;
  left_room: (room: string) => void;
}

interface ClientToServerEvents {
  register: (username: string) => void;
  join_room: (room: string) => void;
  leave_room: (room: string) => void;
  create_room: (room: string) => void;
  room_message: (data: { room: string; message: string }) => void;
  private_message: (data: { to: string; message: string }) => void;
  get_room_users: (room: string) => void;
}

interface ChatMessage {
  id: string;
  type: 'message' | 'system' | 'private_sent' | 'private_received';
  room?: string;
  username?: string;
  text: string;
  timestamp: Date;
}

type ChatTarget = 
  | { type: 'room'; room: string }
  | { type: 'user'; username: string };

// ============================================
// Component
// ============================================

function App() {
  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [username, setUsername] = useState('');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [chatTarget, setChatTarget] = useState<ChatTarget>({ type: 'room', room: 'general' });

  // Room state
  const [allRooms, setAllRooms] = useState<string[]>([]);
  const [myRooms, setMyRooms] = useState<Set<string>>(new Set());
  const [roomUsers, setRoomUsers] = useState<Map<string, string[]>>(new Map());
  const [newRoomName, setNewRoomName] = useState('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  // User state
  const [allUsers, setAllUsers] = useState<string[]>([]);

  // Refs
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Request room users when changing rooms
  useEffect(() => {
    if (chatTarget.type === 'room' && socketRef.current) {
      socketRef.current.emit('get_room_users', chatTarget.room);
    }
  }, [chatTarget]);

  // Generate unique message ID
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Add message
  const addMessage = (
    type: ChatMessage['type'],
    text: string,
    room?: string,
    msgUsername?: string
  ): void => {
    setMessages(prev => [...prev, {
      id: generateId(),
      type,
      text,
      room,
      username: msgUsername,
      timestamp: new Date()
    }]);
  };

  // Connect
  const connect = (): void => {
    if (!username.trim()) {
      setConnectionError('Please enter a username');
      return;
    }

    setIsConnecting(true);
    setConnectionError('');

    const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(
      SERVER_URL,
      { reconnection: true, reconnectionAttempts: 5 }
    );

    socketRef.current = socket;

    // Connected
    socket.on('connect', () => {
      console.log('Connected to server!');
      socket.emit('register', username.trim());
    });

    // Room list
    socket.on('room_list', (rooms) => {
      setAllRooms(rooms);
      
      if (!isConnected) {
        setIsConnected(true);
        setIsConnecting(false);
      }
    });

    // Joined room
    socket.on('joined_room', (room) => {
      setMyRooms(prev => new Set(prev).add(room));
      addMessage('system', `You joined #${room}`, room);
    });

    // Left room
    socket.on('left_room', (room) => {
      setMyRooms(prev => {
        const newSet = new Set(prev);
        newSet.delete(room);
        return newSet;
      });
      addMessage('system', `You left #${room}`);
      
      // Switch to general if we left current room
      if (chatTarget.type === 'room' && chatTarget.room === room) {
        setChatTarget({ type: 'room', room: 'general' });
      }
    });

    // Room users
    socket.on('room_users', ({ room, users }) => {
      setRoomUsers(prev => new Map(prev).set(room, users));
    });

    // User list
    socket.on('user_list', (users) => {
      setAllUsers(users.filter(u => u !== username));
    });

    // Room message
    socket.on('room_message', (data) => {
      const isMine = data.username === username;
      addMessage(
        isMine ? 'message' : 'message',
        data.message,
        data.room,
        data.username
      );
    });

    // Room system message
    socket.on('room_system', ({ room, message }) => {
      addMessage('system', message, room);
    });

    // Private message
    socket.on('private_message', (data) => {
      const isMine = data.from === username;
      addMessage(
        isMine ? 'private_sent' : 'private_received',
        data.message,
        undefined,
        isMine ? `To ${data.to}` : `From ${data.from}`
      );
    });

    // System message
    socket.on('system', (message) => {
      addMessage('system', message);
    });

    // Error
    socket.on('error', (message) => {
      if (message.includes('already taken')) {
        setConnectionError(message);
        setIsConnecting(false);
        socket.disconnect();
      } else {
        addMessage('system', `⚠️ ${message}`);
      }
    });

    // Disconnected
    socket.on('disconnect', () => {
      if (isConnected) {
        addMessage('system', 'Disconnected from server');
      }
      setIsConnected(false);
      setIsConnecting(false);
      setMyRooms(new Set());
      setAllUsers([]);
    });

    // Connection error
    socket.on('connect_error', () => {
      setConnectionError('Could not connect to server');
      setIsConnecting(false);
    });
  };

  // Disconnect
  const disconnect = (): void => {
    socketRef.current?.disconnect();
    socketRef.current = null;
  };

  // Send message
  const sendMessage = (): void => {
    if (!input.trim() || !socketRef.current) return;

    if (chatTarget.type === 'room') {
      socketRef.current.emit('room_message', {
        room: chatTarget.room,
        message: input.trim()
      });
    } else {
      socketRef.current.emit('private_message', {
        to: chatTarget.username,
        message: input.trim()
      });
    }

    setInput('');
  };

  // Create room
  const createRoom = (): void => {
    if (!newRoomName.trim() || !socketRef.current) return;
    
    socketRef.current.emit('create_room', newRoomName.trim());
    setNewRoomName('');
    setShowCreateRoom(false);
  };

  // Join room
  const joinRoom = (room: string): void => {
    if (!socketRef.current || myRooms.has(room)) return;
    socketRef.current.emit('join_room', room);
  };

  // Leave room
  const leaveRoom = (room: string): void => {
    if (!socketRef.current || room === 'general') return;
    socketRef.current.emit('leave_room', room);
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      if (isConnected) sendMessage();
      else if (!isConnecting) connect();
    }
  };

  // Format time
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Filter messages for current view
  const filteredMessages = messages.filter(msg => {
    if (chatTarget.type === 'room') {
      return msg.room === chatTarget.room || (msg.type === 'system' && !msg.room);
    } else {
      if (msg.type === 'private_sent' || msg.type === 'private_received') {
        const otherUser = msg.username?.replace('To ', '').replace('From ', '');
        return otherUser === chatTarget.username;
      }
      return msg.type === 'system' && !msg.room;
    }
  });

  // Get current room users
  const currentRoomUsers = chatTarget.type === 'room' 
    ? roomUsers.get(chatTarget.room) || []
    : [];

  // ============================================
  // Render: Login Screen
  // ============================================

  if (!isConnected) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>💬 Real-Time Chat</h1>
          <p style={styles.loginSubtitle}>Join rooms, chat with everyone</p>

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

          {connectionError && (
            <div style={styles.error}>⚠️ {connectionError}</div>
          )}

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
      {/* Left Sidebar - Rooms */}
      <div style={styles.sidebar}>
        {/* User Info */}
        <div style={styles.userInfo}>
          <div style={styles.avatar}>{username.charAt(0).toUpperCase()}</div>
          <div>
            <div style={styles.userName}>{username}</div>
            <div style={styles.serverInfo}>Connected</div>
          </div>
        </div>

        {/* Rooms Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Rooms</span>
            <button
              onClick={() => setShowCreateRoom(!showCreateRoom)}
              style={styles.addButton}
            >
              +
            </button>
          </div>

          {/* Create Room Input */}
          {showCreateRoom && (
            <div style={styles.createRoom}>
              <input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && createRoom()}
                placeholder="Room name..."
                style={styles.createRoomInput}
                autoFocus
              />
              <button onClick={createRoom} style={styles.createRoomButton}>
                Create
              </button>
            </div>
          )}

          {/* Room List */}
          {allRooms.map((room) => {
            const isJoined = myRooms.has(room);
            const isActive = chatTarget.type === 'room' && chatTarget.room === room;

            return (
              <div
                key={room}
                style={{
                  ...styles.roomItem,
                  ...(isActive ? styles.roomItemActive : {}),
                  opacity: isJoined ? 1 : 0.5
                }}
              >
                <span
                  onClick={() => isJoined && setChatTarget({ type: 'room', room })}
                  style={{ flex: 1, cursor: isJoined ? 'pointer' : 'default' }}
                >
                  # {room}
                </span>
                {!isJoined ? (
                  <button
                    onClick={() => joinRoom(room)}
                    style={styles.joinButton}
                  >
                    Join
                  </button>
                ) : room !== 'general' ? (
                  <button
                    onClick={() => leaveRoom(room)}
                    style={styles.leaveButton}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Direct Messages Section */}
        <div style={styles.section}>
          <div style={styles.sectionHeader}>
            <span style={styles.sectionTitle}>Direct Messages</span>
          </div>

          {allUsers.length > 0 ? (
            allUsers.map((user) => {
              const isActive = chatTarget.type === 'user' && chatTarget.username === user;
              return (
                <div
                  key={user}
                  onClick={() => setChatTarget({ type: 'user', username: user })}
                  style={{
                    ...styles.userItem,
                    ...(isActive ? styles.userItemActive : {})
                  }}
                >
                  <span style={styles.userDot}>●</span>
                  <span>{user}</span>
                </div>
              );
            })
          ) : (
            <div style={styles.noUsers}>No other users online</div>
          )}
        </div>

        {/* Disconnect */}
        <button onClick={disconnect} style={styles.disconnectButton}>
          Disconnect
        </button>
      </div>

      {/* Main Chat Area */}
      <div style={styles.mainChat}>
        {/* Header */}
        <div style={styles.chatHeader}>
          <h2 style={styles.chatTitle}>
            {chatTarget.type === 'room' ? `# ${chatTarget.room}` : `@ ${chatTarget.username}`}
          </h2>
          {chatTarget.type === 'room' && (
            <span style={styles.memberCount}>
              {currentRoomUsers.length} members
            </span>
          )}
          {chatTarget.type === 'user' && (
            <span style={styles.privateIndicator}>🔒 Private</span>
          )}
        </div>

        {/* Messages */}
        <div style={styles.messagesContainer}>
          {filteredMessages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.messageWrapper,
                justifyContent:
                  msg.type === 'system'
                    ? 'center'
                    : msg.username === username || msg.type === 'private_sent'
                    ? 'flex-end'
                    : 'flex-start'
              }}
            >
              <div
                style={{
                  ...styles.message,
                  ...(msg.type === 'system' ? styles.messageSystem : {}),
                  ...(msg.type === 'message' && msg.username === username ? styles.messageSent : {}),
                  ...(msg.type === 'message' && msg.username !== username ? styles.messageReceived : {}),
                  ...(msg.type === 'private_sent' ? styles.messagePrivateSent : {}),
                  ...(msg.type === 'private_received' ? styles.messagePrivateReceived : {})
                }}
              >
                {msg.type !== 'system' && msg.username && (
                  <div style={styles.messageUsername}>{msg.username}</div>
                )}
                <div style={styles.messageText}>{msg.text}</div>
                {msg.type !== 'system' && (
                  <div style={styles.messageTime}>{formatTime(msg.timestamp)}</div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              chatTarget.type === 'room'
                ? `Message #${chatTarget.room}...`
                : `Message ${chatTarget.username}...`
            }
            style={styles.messageInput}
          />
          <button onClick={sendMessage} style={styles.sendButton}>
            Send
          </button>
        </div>
      </div>

      {/* Right Sidebar - Room Members */}
      {chatTarget.type === 'room' && (
        <div style={styles.rightSidebar}>
          <h3 style={styles.rightSidebarTitle}>Members</h3>
          {currentRoomUsers.map((user) => (
            <div
              key={user}
              onClick={() => user !== username && setChatTarget({ type: 'user', username: user })}
              style={{
                ...styles.memberItem,
                cursor: user !== username ? 'pointer' : 'default'
              }}
            >
              <span style={styles.userDot}>●</span>
              <span>{user}</span>
              {user === username && <span style={styles.youBadge}>(you)</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// Styles
// ============================================

const styles: { [key: string]: React.CSSProperties } = {
  // Login
  loginContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#1a1d21',
    padding: '20px',
    boxSizing: 'border-box'
  },
  loginBox: {
    backgroundColor: '#222529',
    padding: '40px',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px'
  },
  loginTitle: {
    margin: '0 0 8px 0',
    fontSize: '28px',
    textAlign: 'center',
    color: '#fff'
  },
  loginSubtitle: {
    margin: '0 0 30px 0',
    color: '#9a9b9e',
    textAlign: 'center'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    fontWeight: '500',
    color: '#d1d2d3'
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #3c3f44',
    borderRadius: '8px',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#1a1d21',
    color: '#fff'
  },
  button: {
    width: '100%',
    padding: '14px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#fff',
    backgroundColor: '#4a9c6d',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  buttonDisabled: {
    backgroundColor: '#3c3f44',
    cursor: 'not-allowed'
  },
  error: {
    backgroundColor: '#5c2b2b',
    color: '#f8d7da',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px'
  },

  // Chat Container
  chatContainer: {
    display: 'flex',
    height: '100vh',
    backgroundColor: '#1a1d21',
    color: '#d1d2d3'
  },

  // Left Sidebar
  sidebar: {
    width: '260px',
    backgroundColor: '#1a1d21',
    borderRight: '1px solid #3c3f44',
    display: 'flex',
    flexDirection: 'column'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    borderBottom: '1px solid #3c3f44'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    backgroundColor: '#4a9c6d',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: '600'
  },
  userName: {
    fontWeight: '600',
    color: '#fff'
  },
  serverInfo: {
    fontSize: '12px',
    color: '#9a9b9e'
  },
  section: {
    padding: '12px',
    flex: 1,
    overflowY: 'auto'
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#9a9b9e',
    letterSpacing: '0.5px'
  },
  addButton: {
    width: '20px',
    height: '20px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#9a9b9e',
    fontSize: '16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  createRoom: {
    display: 'flex',
    gap: '8px',
    marginBottom: '8px'
  },
  createRoomInput: {
    flex: 1,
    padding: '8px',
    fontSize: '14px',
    border: '1px solid #3c3f44',
    borderRadius: '4px',
    backgroundColor: '#222529',
    color: '#fff',
    outline: 'none'
  },
  createRoomButton: {
    padding: '8px 12px',
    fontSize: '12px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#4a9c6d',
    color: '#fff',
    cursor: 'pointer'
  },
  roomItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '2px',
    cursor: 'pointer'
  },
  roomItemActive: {
    backgroundColor: '#1164a3'
  },
  joinButton: {
    padding: '4px 8px',
    fontSize: '11px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#4a9c6d',
    color: '#fff',
    cursor: 'pointer'
  },
  leaveButton: {
    padding: '2px 8px',
    fontSize: '14px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: 'transparent',
    color: '#9a9b9e',
    cursor: 'pointer'
  },
  userItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    borderRadius: '6px',
    marginBottom: '2px',
    cursor: 'pointer'
  },
  userItemActive: {
    backgroundColor: '#1164a3'
  },
  userDot: {
    color: '#4a9c6d',
    fontSize: '10px'
  },
  noUsers: {
    color: '#9a9b9e',
    fontSize: '13px',
    padding: '8px 12px'
  },
  disconnectButton: {
    margin: '12px',
    padding: '10px',
    backgroundColor: '#5c2b2b',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px'
  },

  // Main Chat
  mainChat: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#222529'
  },
  chatHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    borderBottom: '1px solid #3c3f44'
  },
  chatTitle: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#fff'
  },
  memberCount: {
    fontSize: '13px',
    color: '#9a9b9e'
  },
  privateIndicator: {
    fontSize: '12px',
    color: '#9a9b9e',
    backgroundColor: '#3c3f44',
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
    borderRadius: '8px'
  },
  messageSent: {
    backgroundColor: '#1164a3',
    color: '#fff'
  },
  messageReceived: {
    backgroundColor: '#3c3f44',
    color: '#fff'
  },
  messagePrivateSent: {
    backgroundColor: '#6b4c9a',
    color: '#fff'
  },
  messagePrivateReceived: {
    backgroundColor: '#4c3d5a',
    color: '#fff'
  },
  messageSystem: {
    backgroundColor: 'transparent',
    color: '#9a9b9e',
    fontSize: '13px',
    padding: '4px 12px'
  },
  messageUsername: {
    fontSize: '12px',
    fontWeight: '600',
    marginBottom: '4px',
    opacity: 0.9
  },
  messageText: {
    wordBreak: 'break-word'
  },
  messageTime: {
    fontSize: '10px',
    opacity: 0.6,
    marginTop: '4px',
    textAlign: 'right'
  },

  // Input
  inputArea: {
    display: 'flex',
    gap: '12px',
    padding: '16px 20px',
    borderTop: '1px solid #3c3f44'
  },
  messageInput: {
    flex: 1,
    padding: '12px 16px',
    fontSize: '15px',
    border: '1px solid #3c3f44',
    borderRadius: '8px',
    backgroundColor: '#1a1d21',
    color: '#fff',
    outline: 'none'
  },
  sendButton: {
    padding: '12px 24px',
    backgroundColor: '#4a9c6d',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600'
  },

  // Right Sidebar
  rightSidebar: {
    width: '200px',
    backgroundColor: '#1a1d21',
    borderLeft: '1px solid #3c3f44',
    padding: '16px'
  },
  rightSidebarTitle: {
    margin: '0 0 16px 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#fff'
  },
  memberItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px',
    borderRadius: '6px'
  },
  youBadge: {
    fontSize: '11px',
    color: '#9a9b9e',
    marginLeft: 'auto'
  }
};

export default App;