// client/src/config/constants.ts

// API and Socket URLs - supports multiple deployment environments
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD 
    ? 'https://bubuchat-backend.onrender.com' 
    : 'http://localhost:3001');

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
  (import.meta.env.PROD 
    ? 'https://bubuchat-backend.onrender.com' 
    : 'http://localhost:3001');

// For backward compatibility
export const SERVER_URL = API_BASE_URL;

export const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  transports: ['websocket', 'polling'],
  withCredentials: true,
};

export const DEFAULT_ROOM = 'general';
