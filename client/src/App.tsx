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
}

// ============================================
// Component
// ============================================

function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connect = (): void => {
    if (!username.trim()) return;

    const socket = new WebSocket('ws://localhost:3001');
    socketRef.current = socket;

    socket.onopen = (): void => {
      console.log('Connected to server!');
      
      const registerMessage: ClientMessage = {
        type: 'register',
        username: username
      };
      socket.send(JSON.stringify(registerMessage));
      
      setIsConnected(true);
    };

    socket.onmessage = (event: MessageEvent): void => {
      const data: ServerMessage = JSON.parse(event.data);
      console.log('Received:', data);
      
      // Handle user list update
      if (data.type === 'user_list') {
        // Filter out our own username
        setOnlineUsers(data.users.filter(u => u !== username));
        return;
      }
      
      // Handle system message
      if (data.type === 'system') {
        setMessages(prev => [...prev, {
          type: 'system',
          text: data.message
        }]);
        return;
      }
      
      // Handle broadcast message
      if (data.type === 'broadcast') {
        setMessages(prev => [...prev, {
          type: data.username === username ? 'sent' : 'received',
          username: data.username,
          text: data.message
        }]);
        return;
      }
      
      // Handle private message
      if (data.type === 'private') {
        const isSentByMe = data.from === username;
        
        setMessages(prev => [...prev, {
          type: isSentByMe ? 'private_sent' : 'private_received',
          username: isSentByMe ? `To ${data.to}` : `From ${data.from}`,
          text: data.message
        }]);
        return;
      }
    };

    socket.onclose = (): void => {
      console.log('Disconnected');
      setIsConnected(false);
      setOnlineUsers([]);
      setMessages(prev => [...prev, { type: 'system', text: 'Disconnected' }]);
    };

    socket.onerror = (error: Event): void => {
      console.error('WebSocket error:', error);
    };
  };

  const sendMessage = (): void => {
    if (!input.trim() || !socketRef.current) return;
    
    let message: ClientMessage;
    
    if (selectedUser) {
      // Private message
      message = {
        type: 'private_message',
        to: selectedUser,
        message: input
      };
    } else {
      // Broadcast message
      message = {
        type: 'message',
        message: input
      };
    }
    
    socketRef.current.send(JSON.stringify(message));
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      if (isConnected) {
        sendMessage();
      } else {
        connect();
      }
    }
  };

  // ============================================
  // Render: Username Screen
  // ============================================
  
  if (!isConnected) {
    return (
      <div style={{ 
        padding: '20px', 
        maxWidth: '400px', 
        margin: '100px auto', 
        textAlign: 'center' 
      }}>
        <h1>Enter Chat</h1>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter your username..."
          style={{ 
            padding: '10px', 
            width: '100%', 
            marginBottom: '10px', 
            boxSizing: 'border-box' 
          }}
        />
        <button 
          onClick={connect} 
          style={{ padding: '10px 20px', width: '100%', cursor: 'pointer' }}
        >
          Join Chat
        </button>
      </div>
    );
  }

  // ============================================
  // Render: Chat Screen
  // ============================================
  
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      padding: '20px', 
      boxSizing: 'border-box',
      gap: '20px'
    }}>
      
      {/* Sidebar - Online Users */}
      <div style={{ 
        width: '200px', 
        borderRight: '1px solid #ccc',
        paddingRight: '20px'
      }}>
        <h3>Online Users</h3>
        
        {/* Option to send to everyone */}
        <div
          onClick={() => setSelectedUser(null)}
          style={{
            padding: '10px',
            margin: '5px 0',
            backgroundColor: selectedUser === null ? '#007bff' : '#f0f0f0',
            color: selectedUser === null ? '#fff' : '#000',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          📢 Everyone
        </div>
        
        {/* List of online users */}
        {onlineUsers.map((user) => (
          <div
            key={user}
            onClick={() => setSelectedUser(user)}
            style={{
              padding: '10px',
              margin: '5px 0',
              backgroundColor: selectedUser === user ? '#007bff' : '#f0f0f0',
              color: selectedUser === user ? '#fff' : '#000',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            👤 {user}
          </div>
        ))}
        
        {onlineUsers.length === 0 && (
          <p style={{ color: '#999', fontSize: '14px' }}>
            No other users online
          </p>
        )}
      </div>
      
      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h2>
          Chat - {username}
          {selectedUser && (
            <span style={{ fontSize: '14px', color: '#666', marginLeft: '10px' }}>
              (messaging {selectedUser})
            </span>
          )}
        </h2>
        
        {/* Messages */}
        <div style={{ 
          flex: 1,
          border: '1px solid #ccc', 
          overflowY: 'auto',
          padding: '10px',
          marginBottom: '10px'
        }}>
          {messages.map((msg, index) => (
            <div 
              key={index}
              style={{
                padding: '8px',
                margin: '4px 0',
                backgroundColor: 
                  msg.type === 'sent' ? '#dcf8c6' : 
                  msg.type === 'received' ? '#fff' :
                  msg.type === 'private_sent' ? '#cce5ff' :
                  msg.type === 'private_received' ? '#e2d5f1' :
                  '#f0f0f0',
                textAlign: (msg.type === 'sent' || msg.type === 'private_sent') 
                  ? 'right' : 'left',
                borderRadius: '8px',
                border: (msg.type === 'private_sent' || msg.type === 'private_received')
                  ? '1px solid #999' : 'none'
              }}
            >
              {msg.type !== 'system' && msg.username && (
                <strong style={{ fontSize: '12px', color: '#666' }}>
                  {msg.username}
                  {(msg.type === 'private_sent' || msg.type === 'private_received') && ' 🔒'}
                </strong>
              )}
              <div>{msg.text}</div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: '10px' }}>
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
            style={{ flex: 1, padding: '10px' }}
          />
          <button 
            onClick={sendMessage} 
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;