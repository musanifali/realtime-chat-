// client/src/config/constants.ts

// Automatically use the right server URL based on environment
// Development: localhost:3001, Production: will be served from same origin via Nginx proxy
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : 'http://13.49.78.104');

export const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
  withCredentials: true,
};

export const DEFAULT_ROOM = 'general';
