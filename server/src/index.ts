// server/src/index.ts

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { RedisService } from './services/RedisService.js';
import { PubSubService } from './services/PubSubService.js';
import { BroadcastService } from './services/BroadcastService.js';
import { initializeRooms } from './utils/roomInitializer.js';
import { SocketHandlers } from './handlers/SocketHandlers.js';
import { PORT, REDIS_URL, SERVER_ID, CHANNEL } from './config/constants.js';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from './types/index.js';

console.log(`${SERVER_ID}: Starting...`);

// ============================================
// Express & HTTP Server Setup
// ============================================
const app = express();
const httpServer = createServer(app);

// ============================================
// Socket.IO Setup
// ============================================
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://13.49.78.104'],
    methods: ['GET', 'POST']
  }
});

// ============================================
// Initialize Services
// ============================================
const redisService = new RedisService(REDIS_URL);
const broadcastService = new BroadcastService(redisService, io);
const pubSubService = new PubSubService(redisService, broadcastService, io);
const socketHandlers = new SocketHandlers(redisService, pubSubService, broadcastService);

// ============================================
// Connect to Redis
// ============================================
(async () => {
  try {
    await redisService.connect();
    console.log(`${SERVER_ID}: Connected to Redis`);
    
    // Cleanup stale data from previous sessions
    await redisService.cleanupOnStartup();
    
    // Initialize default rooms
    await initializeRooms(redisService);
    
    // Subscribe to Redis channel
    await pubSubService.setupSubscription();
  } catch (error) {
    console.error(`${SERVER_ID}: Redis connection error:`, error);
    process.exit(1);
  }
})();

// ============================================
// Socket.IO Connection Handler
// ============================================
io.on('connection', (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
  console.log(`${SERVER_ID}: New client connected: ${socket.id}`);
  
  // Initialize socket data
  socket.data.rooms = new Set<string>();

  // Register event handlers
  socket.on('register', (username) => 
    socketHandlers.handleRegister(socket, username)
  );

  socket.on('create_room', (room) => 
    socketHandlers.handleCreateRoom(socket, room)
  );

  socket.on('join_room', (room) => 
    socketHandlers.handleJoinRoom(socket, room)
  );

  socket.on('leave_room', (room) => 
    socketHandlers.handleLeaveRoom(socket, room)
  );

  socket.on('room_message', (data) => 
    socketHandlers.handleRoomMessage(socket, data)
  );

  socket.on('private_message', (data) => 
    socketHandlers.handlePrivateMessage(socket, data)
  );

  socket.on('get_room_users', (room) => 
    socketHandlers.handleGetRoomUsers(socket, room)
  );

  socket.on('disconnect', () => 
    socketHandlers.handleDisconnect(socket)
  );
});

// ============================================
// Start Server
// ============================================
httpServer.listen(PORT, () => {
  console.log(`${SERVER_ID}: HTTP server listening on port ${PORT}`);
});

// ============================================
// Graceful Shutdown
// ============================================
process.on('SIGINT', async () => {
  console.log(`\n${SERVER_ID}: Shutting down gracefully...`);
  await redisService.disconnect();
  httpServer.close(() => {
    console.log(`${SERVER_ID}: Server closed`);
    process.exit(0);
  });
});
