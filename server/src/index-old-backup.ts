// server/src/index.ts
import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { createClient } from 'redis';
import type { RedisClientType } from 'redis';

// ============================================
// Types
// ============================================

interface ClientToServerEvents {
  register: (username: string) => void;
  join_room: (room: string) => void;
  leave_room: (room: string) => void;
  create_room: (room: string) => void;
  room_message: (data: { room: string; message: string }) => void;
  private_message: (data: { to: string; message: string }) => void;
  get_room_users: (room: string) => void;
}

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

interface InterServerEvents {}

interface SocketData {
  username: string;
  rooms: Set<string>;
}

// ============================================
// Configuration
// ============================================
const PORT = parseInt(process.env.PORT || '3001');
const SERVER_ID = `Server-${PORT}`;
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CLIENT_URL = process.env.CLIENT_URL || '*';


// Redis keys
const USERS_KEY = 'online_users';
const ROOMS_KEY = 'chat_rooms';
const CHANNEL = 'chat_messages';

// Default rooms
const DEFAULT_ROOMS = ['general', 'random', 'gaming'];

console.log(`${SERVER_ID}: Starting...`);

// ============================================
// Express + Socket.io Setup
// ============================================

const app = express();
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: SERVER_ID });
});
const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
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

// Users
async function addUser(username: string): Promise<void> {
  await redisPublisher.sAdd(USERS_KEY, username);
}

async function removeUser(username: string): Promise<void> {
  await redisPublisher.sRem(USERS_KEY, username);
}

async function getAllUsers(): Promise<string[]> {
  return await redisPublisher.sMembers(USERS_KEY);
}

async function isUsernameTaken(username: string): Promise<boolean> {
  return (await redisPublisher.sIsMember(USERS_KEY, username)) === 1;
}

// Rooms
async function addRoom(room: string): Promise<void> {
  await redisPublisher.sAdd(ROOMS_KEY, room);
}

async function getAllRooms(): Promise<string[]> {
  return await redisPublisher.sMembers(ROOMS_KEY);
}

async function roomExists(room: string): Promise<boolean> {
  return (await redisPublisher.sIsMember(ROOMS_KEY, room)) === 1;
}

// Room members (track who's in which room)
function getRoomMembersKey(room: string): string {
  return `room:${room}:members`;
}

async function addUserToRoom(room: string, username: string): Promise<void> {
  await redisPublisher.sAdd(getRoomMembersKey(room), username);
}

async function removeUserFromRoom(room: string, username: string): Promise<void> {
  await redisPublisher.sRem(getRoomMembersKey(room), username);
}

async function getRoomMembers(room: string): Promise<string[]> {
  return await redisPublisher.sMembers(getRoomMembersKey(room));
}

// ============================================
// Broadcast Helpers
// ============================================

async function broadcastRoomList(): Promise<void> {
  const rooms = await getAllRooms();
  io.emit('room_list', rooms);
}

async function broadcastUserList(): Promise<void> {
  const users = await getAllUsers();
  io.emit('user_list', users);
}

async function broadcastRoomUsers(room: string): Promise<void> {
  const users = await getRoomMembers(room);
  io.to(room).emit('room_users', { room, users });
}

// ============================================
// Redis Pub/Sub
// ============================================

type RedisMessage =
  | { type: 'room_message'; room: string; username: string; message: string }
  | { type: 'private_message'; from: string; to: string; message: string }
  | { type: 'user_joined'; username: string }
  | { type: 'user_left'; username: string }
  | { type: 'room_created'; room: string; creator: string }
  | { type: 'user_joined_room'; room: string; username: string }
  | { type: 'user_left_room'; room: string; username: string };

async function publishToRedis(data: RedisMessage): Promise<void> {
  await redisPublisher.publish(CHANNEL, JSON.stringify(data));
  console.log(`${SERVER_ID}: Published:`, data.type);
}

function handleRedisMessage(rawMessage: string): void {
  try {
    const data: RedisMessage = JSON.parse(rawMessage);
    console.log(`${SERVER_ID}: Received from Redis:`, data.type);

    // Room message
    if (data.type === 'room_message') {
      io.to(data.room).emit('room_message', {
        room: data.room,
        username: data.username,
        message: data.message
      });
      return;
    }

    // Private message
    if (data.type === 'private_message') {
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

    // User joined
    if (data.type === 'user_joined') {
      io.emit('system', `${data.username} joined the chat`);
      broadcastUserList();
      return;
    }

    // User left
    if (data.type === 'user_left') {
      io.emit('system', `${data.username} left the chat`);
      broadcastUserList();
      return;
    }

    // Room created
    if (data.type === 'room_created') {
      io.emit('system', `Room #${data.room} created by ${data.creator}`);
      broadcastRoomList();
      return;
    }

    // User joined room
    if (data.type === 'user_joined_room') {
      io.to(data.room).emit('room_system', {
        room: data.room,
        message: `${data.username} joined #${data.room}`
      });
      broadcastRoomUsers(data.room);
      return;
    }

    // User left room
    if (data.type === 'user_left_room') {
      io.to(data.room).emit('room_system', {
        room: data.room,
        message: `${data.username} left #${data.room}`
      });
      broadcastRoomUsers(data.room);
      return;
    }

  } catch (error) {
    console.error(`${SERVER_ID}: Error handling Redis message:`, error);
  }
}

// ============================================
// Socket.io Connection Handler
// ============================================

io.on('connection', (socket) => {
  console.log(`${SERVER_ID}: New connection - ${socket.id}`);
  socket.data.rooms = new Set();

  // ========================================
  // Register
  // ========================================
  socket.on('register', async (username: string) => {
    console.log(`${SERVER_ID}: Register - ${username}`);

    if (await isUsernameTaken(username)) {
      socket.emit('error', `Username "${username}" is already taken`);
      socket.disconnect();
      return;
    }

    socket.data.username = username;
    await addUser(username);

    // Auto-join #general
    socket.join('general');
    socket.data.rooms.add('general');
    await addUserToRoom('general', username);

    // Send initial data
    const rooms = await getAllRooms();
    socket.emit('room_list', rooms);
    socket.emit('joined_room', 'general');

    await publishToRedis({ type: 'user_joined', username });
    await publishToRedis({ type: 'user_joined_room', room: 'general', username });

    console.log(`${SERVER_ID}: ${username} registered and joined #general`);
  });

  // ========================================
  // Create Room
  // ========================================
  socket.on('create_room', async (room: string) => {
    const username = socket.data.username;
    if (!username) return;

    // Validate room name
    const roomName = room.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (!roomName || roomName.length < 2) {
      socket.emit('error', 'Invalid room name (use letters, numbers, dashes)');
      return;
    }

    if (await roomExists(roomName)) {
      socket.emit('error', `Room #${roomName} already exists`);
      return;
    }

    await addRoom(roomName);
    await publishToRedis({ type: 'room_created', room: roomName, creator: username });

    console.log(`${SERVER_ID}: ${username} created room #${roomName}`);
  });

  // ========================================
  // Join Room
  // ========================================
  socket.on('join_room', async (room: string) => {
    const username = socket.data.username;
    if (!username) return;

    if (!(await roomExists(room))) {
      socket.emit('error', `Room #${room} doesn't exist`);
      return;
    }

    if (socket.data.rooms.has(room)) {
      socket.emit('error', `You're already in #${room}`);
      return;
    }

    socket.join(room);
    socket.data.rooms.add(room);
    await addUserToRoom(room, username);

    socket.emit('joined_room', room);
    await publishToRedis({ type: 'user_joined_room', room, username });

    console.log(`${SERVER_ID}: ${username} joined #${room}`);
  });

  // ========================================
  // Leave Room
  // ========================================
  socket.on('leave_room', async (room: string) => {
    const username = socket.data.username;
    if (!username) return;

    if (room === 'general') {
      socket.emit('error', "You can't leave #general");
      return;
    }

    if (!socket.data.rooms.has(room)) {
      socket.emit('error', `You're not in #${room}`);
      return;
    }

    socket.leave(room);
    socket.data.rooms.delete(room);
    await removeUserFromRoom(room, username);

    socket.emit('left_room', room);
    await publishToRedis({ type: 'user_left_room', room, username });

    console.log(`${SERVER_ID}: ${username} left #${room}`);
  });

  // ========================================
  // Room Message
  // ========================================
  socket.on('room_message', async (data: { room: string; message: string }) => {
    const username = socket.data.username;
    if (!username) return;

    if (!socket.data.rooms.has(data.room)) {
      socket.emit('error', `You're not in #${data.room}`);
      return;
    }

    await publishToRedis({
      type: 'room_message',
      room: data.room,
      username,
      message: data.message
    });

    console.log(`${SERVER_ID}: ${username} → #${data.room}: ${data.message}`);
  });

  // ========================================
  // Private Message
  // ========================================
  socket.on('private_message', async (data: { to: string; message: string }) => {
    const username = socket.data.username;
    if (!username) return;

    if (!(await isUsernameTaken(data.to))) {
      socket.emit('error', `User "${data.to}" is not online`);
      return;
    }

    await publishToRedis({
      type: 'private_message',
      from: username,
      to: data.to,
      message: data.message
    });

    console.log(`${SERVER_ID}: ${username} → ${data.to} (private): ${data.message}`);
  });

  // ========================================
  // Get Room Users
  // ========================================
  socket.on('get_room_users', async (room: string) => {
    const users = await getRoomMembers(room);
    socket.emit('room_users', { room, users });
  });

  // ========================================
  // Disconnect
  // ========================================
  socket.on('disconnect', async () => {
    const username = socket.data.username;
    console.log(`${SERVER_ID}: Disconnect - ${username || socket.id}`);

    if (username) {
      // Remove from all rooms
      for (const room of socket.data.rooms) {
        await removeUserFromRoom(room, username);
        await publishToRedis({ type: 'user_left_room', room, username });
      }

      await removeUser(username);
      await publishToRedis({ type: 'user_left', username });
    }
  });
});

// ============================================
// Initialize & Start Server
// ============================================

async function initializeRooms(): Promise<void> {
  for (const room of DEFAULT_ROOMS) {
    if (!(await roomExists(room))) {
      await addRoom(room);
      console.log(`${SERVER_ID}: Created default room #${room}`);
    }
  }
}

async function startServer(): Promise<void> {
  try {
    await redisPublisher.connect();
    console.log(`${SERVER_ID}: Redis publisher connected`);

    await redisSubscriber.connect();
    console.log(`${SERVER_ID}: Redis subscriber connected`);

    await redisSubscriber.subscribe(CHANNEL, handleRedisMessage);
    console.log(`${SERVER_ID}: Subscribed to "${CHANNEL}"`);

    await initializeRooms();

    httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`${SERVER_ID}: Server running on port ${PORT}`);
 });

  } catch (error) {
    console.error(`${SERVER_ID}: Failed to start:`, error);
    process.exit(1);
  }
}

process.on('SIGINT', async () => {
  console.log(`\n${SERVER_ID}: Shutting down...`);

  const sockets = io.sockets.sockets;
  for (const [, socket] of sockets) {
    const username = socket.data.username;
    if (username) {
      for (const room of socket.data.rooms) {
        await removeUserFromRoom(room, username);
      }
      await removeUser(username);
    }
  }

  await redisPublisher.quit();
  await redisSubscriber.quit();
  process.exit(0);
});

startServer();