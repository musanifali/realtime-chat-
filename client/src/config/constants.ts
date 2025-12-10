// client/src/config/constants.ts

// Automatically use the right server URL based on environment
export const SERVER_URL = process.env.NODE_ENV === 'production' 
  ? 'http://13.49.78.104' 
  : 'http://localhost:3003';

export const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
};

export const DEFAULT_ROOM = 'general';
