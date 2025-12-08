// server/src/index.ts
import { WebSocketServer, WebSocket } from 'ws';
import { createClient, RedisClientType } from 'redis';

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

// NEW: Messages that go through Redis
type RedisMessage = 
  | { type: 'broadcast'; username: string; message: string }
  | { type: 'private'; from: string; to: string; message: string }
  | { type: 'user_joined'; username: string }
  | { type: 'user_left'; username: string }
  | { type: 'user_list_request'; requestingServer: string };

// ============================================
// Configuration
// ============================================

const PORT = parseInt(process.argv[2] || '3001');
const SERVER_ID = `Server-${PORT}`;
const REDIS_URL = 'redis://localhost:6379';
const CHANNEL = 'chat_messages';

console.log(`${SERVER_ID}: Starting...`);

// ============================================
// Redis Setup
// ============================================

// Two connections: one for publishing, one for subscribing
const redisPublisher: RedisClientType = createClient({ url: REDIS_URL });
const redisSubscriber: RedisClientType = createClient({ url: REDIS_URL });

// ============================================
// Local State (only users on THIS server)
// ============================================

const localSockets = new Set<WebSocket>();
const localUsernames = new Map<WebSocket, string>();       // socket → username
const localUsernameToSocket = new Map<string, WebSocket>(); // username → socket

// ============================================
// Helper Functions
// ============================================

function sendToSocket(socket: WebSocket, data: ServerMessage): void {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
  }
}

function broadcastToLocalSockets(data: ServerMessage): void {
  localSockets.forEach((socket) => {
    sendToSocket(socket, data);
  });
}

function getLocalUsers(): string[] {
  return Array.from(localUsernames.values());
}

// NEW: Publish message to Redis (all servers will receive)
async function publishToRedis(data: RedisMessage): Promise<void> {
  await redisPublisher.publish(CHANNEL, JSON.stringify(data));
  console.log(`${SERVER_ID}: Published to Redis:`, data.type);
}

// ============================================
// Redis Message Handler
// ============================================

function handleRedisMessage(rawMessage: string): void {
  try {
    const data: RedisMessage = JSON.parse(rawMessage);
    console.log(`${SERVER_ID}: Received from Redis:`, data.type);

    // Handle broadcast message
    if (data.type === 'broadcast') {
      // Send to ALL local users
      broadcastToLocalSockets({
        type: 'broadcast',
        username: data.username,
        message: data.message
      });
      return;
    }

    // Handle private message
    if (data.type === 'private') {
      // Check if recipient is on THIS server
      const recipientSocket = localUsernameToSocket.get(data.to);
      
      if (recipientSocket) {
        console.log(`${SERVER_ID}: Delivering private message to ${data.to}`);
        sendToSocket(recipientSocket, {
          type: 'private',
          from: data.from,
          to: data.to,
          message: data.message
        });
      }

      // Also send to sender if they're on this server
      const senderSocket = localUsernameToSocket.get(data.from);
      if (senderSocket) {
        sendToSocket(senderSocket, {
          type: 'private',
          from: data.from,
          to: data.to,
          message: data.message
        });
      }
      return;
    }

    // Handle user joined
    if (data.type === 'user_joined') {
      broadcastToLocalSockets({
        type: 'system',
        message: `${data.username} joined the chat`
      });
      // Request updated user list
      broadcastUserList();
      return;
    }

    // Handle user left
    if (data.type === 'user_left') {
      broadcastToLocalSockets({
        type: 'system',
        message: `${data.username} left the chat`
      });
      broadcastUserList();
      return;
    }

  } catch (error) {
    console.error(`${SERVER_ID}: Error handling Redis message:`, error);
  }
}

// ============================================
// User List Management
// ============================================

// For simplicity, we'll use Redis to store all online users
const USERS_KEY = 'online_users';

async function addUserToRedis(username: string): Promise<void> {
  await redisPublisher.sAdd(USERS_KEY, username);
}

async function removeUserFromRedis(username: string): Promise<void> {
  await redisPublisher.sRem(USERS_KEY, username);
}

async function getAllUsersFromRedis(): Promise<string[]> {
  return await redisPublisher.sMembers(USERS_KEY);
}

async function broadcastUserList(): Promise<void> {
  const allUsers = await getAllUsersFromRedis();
  broadcastToLocalSockets({
    type: 'user_list',
    users: allUsers
  });
}

// ============================================
// WebSocket Server Setup
// ============================================

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (socket: WebSocket) => {
  console.log(`${SERVER_ID}: New connection`);
  localSockets.add(socket);

  // Handle messages from client
  socket.on('message', async (rawData: Buffer) => {
    try {
      const data: ClientMessage = JSON.parse(rawData.toString());
      console.log(`${SERVER_ID}: Received from client:`, data);

      // ========================================
      // Handle: Register
      // ========================================
      if (data.type === 'register') {
        const username = data.username;

        // Check if username already taken (in Redis)
        const existingUsers = await getAllUsersFromRedis();
        if (existingUsers.includes(username)) {
          sendToSocket(socket, {
            type: 'system',
            message: `Username "${username}" is already taken!`
          });
          socket.close();
          return;
        }

        // Register locally
        localUsernames.set(socket, username);
        localUsernameToSocket.set(username, socket);

        // Register in Redis
        await addUserToRedis(username);

        console.log(`${SERVER_ID}: ${username} registered`);

        // Notify all servers
        await publishToRedis({
          type: 'user_joined',
          username: username
        });

        // Send current user list to this user
        await broadcastUserList();

        return;
      }

      // ========================================
      // Handle: Broadcast Message
      // ========================================
      if (data.type === 'message') {
        const username = localUsernames.get(socket);
        if (!username) return;

        // Publish to Redis (all servers will receive)
        await publishToRedis({
          type: 'broadcast',
          username: username,
          message: data.message
        });

        return;
      }

      // ========================================
      // Handle: Private Message
      // ========================================
      if (data.type === 'private_message') {
        const fromUsername = localUsernames.get(socket);
        if (!fromUsername) return;

        // Check if recipient exists (in Redis)
        const existingUsers = await getAllUsersFromRedis();
        if (!existingUsers.includes(data.to)) {
          sendToSocket(socket, {
            type: 'system',
            message: `User "${data.to}" is not online`
          });
          return;
        }

        // Publish to Redis (the server with recipient will deliver)
        await publishToRedis({
          type: 'private',
          from: fromUsername,
          to: data.to,
          message: data.message
        });

        return;
      }

    } catch (error) {
      console.error(`${SERVER_ID}: Error handling client message:`, error);
    }
  });

  // Handle disconnection
  socket.on('close', async () => {
    const username = localUsernames.get(socket);
    console.log(`${SERVER_ID}: ${username || 'Unknown'} disconnected`);

    // Clean up locally
    localSockets.delete(socket);
    if (username) {
      localUsernames.delete(socket);
      localUsernameToSocket.delete(username);

      // Remove from Redis
      await removeUserFromRedis(username);

      // Notify all servers
      await publishToRedis({
        type: 'user_left',
        username: username
      });
    }
  });

  // Handle errors
  socket.on('error', (error: Error) => {
    console.error(`${SERVER_ID}: Socket error:`, error);
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
    console.log(`${SERVER_ID}: Subscribed to channel "${CHANNEL}"`);

    console.log(`${SERVER_ID}: WebSocket server running on port ${PORT}`);
    console.log(`${SERVER_ID}: Ready!`);

  } catch (error) {
    console.error(`${SERVER_ID}: Failed to start:`, error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log(`\n${SERVER_ID}: Shutting down...`);
  
  // Remove all local users from Redis
  for (const username of localUsernames.values()) {
    await removeUserFromRedis(username);
  }
  
  await redisPublisher.quit();
  await redisSubscriber.quit();
  
  process.exit(0);
});

// Start!
startServer();