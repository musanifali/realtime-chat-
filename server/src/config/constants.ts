// server/src/config/constants.ts

import { env } from './env.js';

// Re-export validated environment variables
export const PORT = env.PORT;
export const SERVER_ID = env.SERVER_ID;
export const REDIS_URL = env.REDIS_URL;
export const UPSTASH_REDIS_REST_URL = env.UPSTASH_REDIS_REST_URL;
export const UPSTASH_REDIS_REST_TOKEN = env.UPSTASH_REDIS_REST_TOKEN;
export const CHANNEL = env.CHANNEL;
export const CORS_ORIGIN = env.CORS_ORIGIN;

// Redis keys
export const USERS_KEY = 'online_users';

// Rate limiting
export const ENABLE_RATE_LIMITING = env.ENABLE_RATE_LIMITING;
export const MAX_MESSAGES_PER_MINUTE = env.MAX_MESSAGES_PER_MINUTE;
