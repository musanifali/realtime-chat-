// server/src/config/constants.ts

// Use PORT environment variable, default to 3001 for production
export const PORT = parseInt(process.env.PORT || '3001');
export const SERVER_ID = `Server-${PORT}`;
// Support both local dev Redis (6381) and production (6379)
export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const CLIENT_URL = process.env.CLIENT_URL || '*';

// Redis keys
export const USERS_KEY = 'online_users';
export const ROOMS_KEY = 'chat_rooms';
export const CHANNEL = 'chat_messages';

// Default rooms
export const DEFAULT_ROOMS = ['general', 'random', 'gaming'];
