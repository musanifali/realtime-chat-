// server/src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';


// ============================================
// Types
// ============================================

// Events from Client to Server
interface ClientToServerEvents {
  register: (username: string) => void;
  message: (message: string) => void;
  private_message: (data: { to: string; message: string }) => void;
}

// Events from Server to Client
interface ServerToClientEvents {
  broadcast: (data: { username: string; message: string }) => void;
  private_message: (data: { from: string; to: string; message: string }) => void;
  user_list: (users: string[]) => void;
  system: (message: string) => void;
  error: (message: string) => void;
}

// Internal server events (for Redis)
interface InterServerEvents {
  // Empty for now, used for server-to-server communication
}

// Data attached to each socket
interface SocketData {
  username: string;
}

// ============================================
// Configuration
// ============================================

const PORT = parseInt(process.argv[2] || '3001');
const SERVER_ID = `Server-${PORT}`;
const REDIS_URL = 'redis://localhost:6381';
const USERS_KEY = 'online_users';
const CHANNEL = 'chat_messages';

console.log(`${SERVER_ID}: Starting...`);

// ============================================
// Express + Socket.io Setup
// ============================================

const app = express();
const httpServer = createServer(app);

// Create Socket.io server with types
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174'],  // React dev server
    methods: ['GET', 'POST']
  }
});

// ============================================
// Redis Setup
// ============================================

const redisPublisher: RedisClientType = createClient({ url: REDIS_URL });
const redisSubscriber: RedisClientType = createClient({ url: REDIS_URL });

// ============================================
// Redis Helper Functions
// ============================================

async function addUserToRedis(username: string): Promise<void> {
  await redisPublisher.sAdd(USERS_KEY, username);
}

async function removeUserFromRedis(username: string): Promise<void> {
  await redisPublisher.sRem(USERS_KEY, username);
}

async function getAllUsers(): Promise<string[]> {
  return await redisPublisher.sMembers(USERS_KEY);
}

async function isUsernameTaken(username: string): Promise<boolean> {
  const result = await redisPublisher.sIsMember(USERS_KEY, username);
  return result === 1;
}

// ============================================
// Broadcast User List to All Local Sockets
// ============================================

async function broadcastUserList(): Promise<void> {
  const users = await getAllUsers();
  io.emit('user_list', users);
}

// ============================================
// Redis Pub/Sub Message Types
// ============================================

type RedisMessage =
  | { type: 'broadcast'; username: string; message: string }
  | { type: 'private'; from: string; to: string; message: string }
  | { type: 'user_joined'; username: string }
  | { type: 'user_left'; username: string };

// Publish to Redis
async function publishToRedis(data: RedisMessage): Promise<void> {
  await redisPublisher.publish(CHANNEL, JSON.stringify(data));
  console.log(`${SERVER_ID}: Published:`, data.type);
}

// Handle messages from Redis
function handleRedisMessage(rawMessage: string): void {
  try {
    const data: RedisMessage = JSON.parse(rawMessage);
    console.log(`${SERVER_ID}: Received from Redis:`, data.type);

    if (data.type === 'broadcast') {
      // Send to all connected clients on this server
      io.emit('broadcast', {
        username: data.username,
        message: data.message
      });
      return;
    }

    if (data.type === 'private') {
      // Find recipient and sender on this server
      const sockets = io.sockets.sockets;
      
      sockets.forEach((socket) => {
        if (socket.data.username === data.to || socket.data.username === data.from) {
          socket.emit('private_message', {
            from: data.from,
            to: data.to,
            message: data.message
          });
        }
      });
      return;
    }

    if (data.type === 'user_joined') {
      io.emit('system', `${data.username} joined the chat`);
      broadcastUserList();
      return;
    }

    if (data.type === 'user_left') {
      io.emit('system', `${data.username} left the chat`);
      broadcastUserList();
      return;
    }

  } catch (error) {
    console.error(`${SERVER_ID}: Error handling Redis message:`, error);
  }
}

// ============================================
// Socket.io Connection Handler
// ============================================

io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
  console.log(`${SERVER_ID}: New connection - ${socket.id}`);

  // ========================================
  // Handle: Register
  // ========================================
  socket.on('register', async (username: string) => {
    console.log(`${SERVER_ID}: Register request - ${username}`);

    // Check if username taken
    if (await isUsernameTaken(username)) {
      socket.emit('error', `Username "${username}" is already taken`);
      socket.disconnect();
      return;
    }

    // Store username in socket data
    socket.data.username = username;

    // Add to Redis
    await addUserToRedis(username);

    console.log(`${SERVER_ID}: ${username} registered`);

    // Notify all servers
    await publishToRedis({
      type: 'user_joined',
      username: username
    });
  });

  // ========================================
  // Handle: Broadcast Message
  // ========================================
  socket.on('message', async (message: string) => {
    const username = socket.data.username;
    
    if (!username) {
      socket.emit('error', 'You must register first');
      return;
    }

    console.log(`${SERVER_ID}: Message from ${username}: ${message}`);

    // Publish to Redis (all servers will receive)
    await publishToRedis({
      type: 'broadcast',
      username: username,
      message: message
    });
  });

  // ========================================
  // Handle: Private Message
  // ========================================
  socket.on('private_message', async (data: { to: string; message: string }) => {
    const fromUsername = socket.data.username;

    if (!fromUsername) {
      socket.emit('error', 'You must register first');
      return;
    }

    // Check if recipient exists
    if (!(await isUsernameTaken(data.to))) {
      socket.emit('system', `User "${data.to}" is not online`);
      return;
    }

    console.log(`${SERVER_ID}: Private message ${fromUsername} → ${data.to}`);

    // Publish to Redis
    await publishToRedis({
      type: 'private',
      from: fromUsername,
      to: data.to,
      message: data.message
    });
  });

  // ========================================
  // Handle: Disconnect
  // ========================================
  socket.on('disconnect', async () => {
    const username = socket.data.username;
    console.log(`${SERVER_ID}: Disconnected - ${username || socket.id}`);

    if (username) {
      // Remove from Redis
      await removeUserFromRedis(username);

      // Notify all servers
      await publishToRedis({
        type: 'user_left',
        username: username
      });
    }
  });
});

// ============================================
// Start Server
// ============================================

async function startServer(): Promise<void> {
  try {
    // Connect to Redis
    await redisPublisher.connect();
    console.log(`${SERVER_ID}: Redis publisher connected`);

    await redisSubscriber.connect();
    console.log(`${SERVER_ID}: Redis subscriber connected`);

    // Subscribe to channel
    await redisSubscriber.subscribe(CHANNEL, handleRedisMessage);
    console.log(`${SERVER_ID}: Subscribed to "${CHANNEL}"`);

    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`${SERVER_ID}: Server running on port ${PORT}`);
      console.log(`${SERVER_ID}: Ready!`);
    });

  } catch (error) {
    console.error(`${SERVER_ID}: Failed to start:`, error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log(`\n${SERVER_ID}: Shutting down...`);

  // Remove all local users from Redis
  const sockets = io.sockets.sockets;
  for (const [, socket] of sockets) {
    if (socket.data.username) {
      await removeUserFromRedis(socket.data.username);
    }
  }

  await redisPublisher.quit();
  await redisSubscriber.quit();

  process.exit(0);
});

// Start!
startServer();