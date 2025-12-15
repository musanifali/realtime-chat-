// server/src/index.ts

import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cookieParser from 'cookie-parser';
import { RedisService } from './services/RedisService.js';
import { PubSubService } from './services/PubSubService.js';
import { BroadcastService } from './services/BroadcastService.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';

import { validateEnvironment } from './config/env.js';
import { SocketHandlers } from './handlers/SocketHandlers.js';
import { PORT, REDIS_URL, SERVER_ID, CHANNEL } from './config/constants.js';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from './types/index.js';
import { verifyAccessToken } from './utils/jwt.js';
import { logger } from './utils/logger.js';
import { requestLogger } from './middleware/requestLogger.js';

// Import routes
import authRoutes from './routes/auth.js';
import friendRoutes from './routes/friends.js';

// Validate environment configuration first
validateEnvironment();

logger.info(`${SERVER_ID}: Starting server...`);

// ============================================
// Express & HTTP Server Setup
// ============================================
const app = express();

// Middleware
app.use(requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// CORS headers for API routes
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

// API Routes
import messageRoutes from './routes/messages.js';
import pushRoutes from './routes/push.js';
app.use('/api/auth', authRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/push', pushRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', server: SERVER_ID });
});

const httpServer = createServer(app);

// ============================================
// Socket.IO Setup
// ============================================
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000', 'http://13.49.78.104'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// ============================================
// Initialize Services
// ============================================
const redisService = new RedisService(REDIS_URL);
const broadcastService = new BroadcastService(redisService, io);
const pubSubService = new PubSubService(redisService, broadcastService, io);
const socketHandlers = new SocketHandlers(redisService, pubSubService, broadcastService);

// ============================================
// Connect to Database & Redis
// ============================================
(async () => {
  try {
    // Connect to MongoDB
    await connectDatabase();
    logger.db('Connected to MongoDB');
    
    // Connect to Redis
    await redisService.connect();
    logger.redis('Connected to Redis');
    
    // Cleanup stale data from previous sessions
    await redisService.cleanupOnStartup();
    
    // Subscribe to Redis channel
    await pubSubService.setupSubscription();
  } catch (error) {
    logger.error('Connection error', error);
    process.exit(1);
  }
})();

// ============================================
// Socket.IO Connection Handler with JWT Auth
// ============================================
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  logger.auth('JWT Middleware - Token received', { hasToken: !!token });
  
  if (!token) {
    logger.warn('JWT Middleware - No token provided');
    return next(new Error('Authentication token missing'));
  }

  try {
    const payload = verifyAccessToken(token);
    if (!payload) {
      logger.warn('JWT Middleware - Invalid/expired token');
      return next(new Error('Invalid or expired token'));
    }

    logger.auth('JWT Middleware - Valid token', { username: payload.username });

    // Attach user data to socket
    socket.data.userId = payload.userId;
    socket.data.username = payload.username;
    socket.data.email = payload.email;
    
    next();
  } catch (error: any) {
    console.log(`${SERVER_ID}: ❌ JWT Middleware - Error:`, error.message);
    next(new Error('Authentication failed'));
  }
});

io.on('connection', async (socket: Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>) => {
  logger.socket('Client connected', { socketId: socket.id });
  logger.debug('Socket data', {
    userId: socket.data.userId,
    username: socket.data.username,
    email: socket.data.email
  });
  
  // Auto-register user with JWT auth
  if (socket.data.username) {
    logger.socket('Auto-registering user', { username: socket.data.username });
    await socketHandlers.handleRegister(socket, socket.data.username);
  } else {
    logger.warn('No username in socket data - user not auto-registered');
  }
  
  // Register event handlers (keep for backward compatibility)
  socket.on('register', (username) => 
    socketHandlers.handleRegister(socket, username)
  );

  socket.on('private_message', (data) => 
    socketHandlers.handlePrivateMessage(socket, data)
  );

  socket.on('typing_start', (data) => 
    socketHandlers.handleTypingStart(socket, data)
  );

  socket.on('typing_stop', (data) => 
    socketHandlers.handleTypingStop(socket, data)
  );

  socket.on('message_reaction', (data) =>
    socketHandlers.handleMessageReaction(socket, data)
  );

  // Friend request events
  socket.on('friend_request_sent', async (data) => {
    // Notify recipient about new friend request via broadcast
    io.emit('friend_request_received', {
      requestId: data.requestId,
      recipientId: data.recipientId,
      requester: data.requester,
    });
  });

  socket.on('friend_request_accepted', async (data) => {
    // Notify requester that request was accepted via broadcast
    io.emit('friend_request_accepted', {
      friendshipId: data.friendshipId,
      requesterId: data.requesterId,
      friend: data.friend,
    });
  });

  socket.on('friend_removed', async (data) => {
    // Notify the friend that they were removed via broadcast
    io.emit('friend_removed', {
      friendId: data.friendId,
      userId: data.userId,
    });
  });

  socket.on('disconnect', () => 
    socketHandlers.handleDisconnect(socket)
  );
});

// ============================================
// Start Server
// ============================================
httpServer.listen(PORT, () => {
  logger.info(`🚀 HTTP server listening on port ${PORT}`);
  logger.info(`📡 Ready to accept connections`);
});

// ============================================
// Graceful Shutdown
// ============================================
process.on('SIGINT', async () => {
  logger.info('\n🛑 Shutting down gracefully...');
  await redisService.disconnect();
  await disconnectDatabase();
  httpServer.close(() => {
    logger.info('✅ Server closed successfully');
    process.exit(0);
  });
});
