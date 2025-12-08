// server/src/index.ts
import { WebSocketServer, WebSocket } from 'ws';

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

// ============================================
// Server Setup
// ============================================

const PORT = 3001;
const wss = new WebSocketServer({ port: PORT });

console.log(`WebSocket server started on port ${PORT}`);

const allSockets = new Set<WebSocket>();
const socketUsernames = new Map<WebSocket, string>();
const usernameToSocket = new Map<string, WebSocket>();  // NEW: reverse lookup

// ============================================
// Helper Functions
// ============================================

function send(socket: WebSocket, data: ServerMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function broadcast(data: ServerMessage): void {
  allSockets.forEach((socket) => {
    send(socket, data);
  });
}

function getOnlineUsers(): string[] {
  return Array.from(socketUsernames.values());
}

function broadcastUserList(): void {
  broadcast({
    type: 'user_list',
    users: getOnlineUsers()
  });
}

// ============================================
// Connection Handler
// ============================================

wss.on('connection', (socket: WebSocket) => {
  console.log('Someone connected!');
  allSockets.add(socket);
  
  socket.on('message', (rawData: Buffer) => {
    try {
      const data: ClientMessage = JSON.parse(rawData.toString());
      console.log('Received:', data);
      
      // ============================================
      // Handle: Register
      // ============================================
      if (data.type === 'register') {
        const username = data.username;
        
        // Check if username already taken
        if (usernameToSocket.has(username)) {
          send(socket, {
            type: 'system',
            message: `Username "${username}" is already taken!`
          });
          socket.close();
          return;
        }
        
        // Register the user
        socketUsernames.set(socket, username);
        usernameToSocket.set(username, socket);
        
        console.log(`${username} joined the chat`);
        console.log('Online users:', getOnlineUsers());
        
        // Send current user list to everyone
        broadcastUserList();
        
        // Notify everyone
        broadcast({
          type: 'system',
          message: `${username} joined the chat`
        });
        
        return;
      }
      
      // ============================================
      // Handle: Broadcast Message
      // ============================================
      if (data.type === 'message') {
        const username = socketUsernames.get(socket);
        
        if (!username) {
          console.log('Message from unregistered user, ignoring');
          return;
        }
        
        broadcast({
          type: 'broadcast',
          username: username,
          message: data.message
        });
        return;
      }
      
      // ============================================
      // Handle: Private Message
      // ============================================
      if (data.type === 'private_message') {
        const fromUsername = socketUsernames.get(socket);
        
        if (!fromUsername) {
          console.log('Private message from unregistered user, ignoring');
          return;
        }
        
        const toSocket = usernameToSocket.get(data.to);
        
        if (!toSocket) {
          // Recipient not found
          send(socket, {
            type: 'system',
            message: `User "${data.to}" is not online`
          });
          return;
        }
        
        const privateMessage: ServerMessage = {
          type: 'private',
          from: fromUsername,
          to: data.to,
          message: data.message
        };
        
        // Send to recipient
        send(toSocket, privateMessage);
        
        // Send to sender (so they see their own message)
        send(socket, privateMessage);
        
        console.log(`Private message: ${fromUsername} → ${data.to}`);
        return;
      }
      
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  });
  
  socket.on('close', () => {
    const username = socketUsernames.get(socket);
    console.log(`${username || 'Someone'} disconnected`);
    
    // Clean up
    allSockets.delete(socket);
    if (username) {
      socketUsernames.delete(socket);
      usernameToSocket.delete(username);
      
      // Update everyone's user list
      broadcastUserList();
      
      // Notify everyone
      broadcast({
        type: 'system',
        message: `${username} left the chat`
      });
    }
    
    console.log('Online users:', getOnlineUsers());
  });
  
  socket.on('error', (error: Error) => {
    console.error('Socket error:', error);
  });
});