// client/src/config/constants.ts

// Automatically use the right server URL based on environment
const getServerUrl = () => {
  // If explicitly set via env var, use it
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // Development: use localhost
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // Production: check if we're on Vercel
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('vercel.app') || window.location.hostname.includes('bubuchats')) {
      return 'https://bubuchat-backend.onrender.com';
    }
  }
  
  // Fallback: same origin (for self-hosted with nginx proxy)
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
};

export const SERVER_URL = getServerUrl();

export const SOCKET_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
  withCredentials: true,
};

export const DEFAULT_ROOM = 'general';
