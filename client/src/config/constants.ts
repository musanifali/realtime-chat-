// client/src/config/constants.ts

// Automatically use the right server URL based on environment
// Development: localhost:3001, Production: use same origin (nginx proxy)
export const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001' : window.location.origin);

export const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
  withCredentials: true,
};

export const DEFAULT_ROOM = 'general';
