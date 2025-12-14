// server/src/config/env.ts

import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env') });

/**
 * Validates that a required environment variable is set
 */
function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key] || defaultValue;
  
  if (!value) {
    throw new Error(`❌ Required environment variable "${key}" is not set!`);
  }
  
  // Warn if using default values in production
  if (defaultValue && value === defaultValue && process.env.NODE_ENV === 'production') {
    console.warn(`⚠️  WARNING: Using default value for "${key}" in production!`);
  }
  
  return value;
}

/**
 * Validates JWT secrets strength
 */
function validateJWTSecret(secret: string, name: string): void {
  if (secret.length < 32) {
    console.warn(`⚠️  WARNING: ${name} is too short (< 32 characters). Use a stronger secret!`);
  }
  
  if (secret.includes('change') || secret.includes('secret') || secret.includes('your-')) {
    console.warn(`⚠️  WARNING: ${name} appears to be a placeholder. Change it in production!`);
  }
}

/**
 * Validated environment configuration
 */
export const env = {
  // Server
  PORT: parseInt(requireEnv('PORT', '3001')),
  NODE_ENV: requireEnv('NODE_ENV', 'development') as 'development' | 'production' | 'test',
  SERVER_ID: requireEnv('SERVER_ID', `server-${Math.random().toString(36).substring(7)}`),
  
  // Database
  MONGODB_URI: requireEnv('MONGODB_URI', 'mongodb://localhost:27017/realtime-chat'),
  REDIS_URL: requireEnv('REDIS_URL', 'redis://localhost:6379'),
  
  // JWT
  JWT_SECRET: requireEnv('JWT_SECRET'),
  JWT_REFRESH_SECRET: requireEnv('JWT_REFRESH_SECRET'),
  JWT_ACCESS_EXPIRES_IN: '15m',
  JWT_REFRESH_EXPIRES_IN: '7d',
  
  // PubSub
  CHANNEL: requireEnv('CHANNEL', 'chat-channel'),
  
  // CORS
  CORS_ORIGIN: requireEnv('CORS_ORIGIN', 'http://localhost:5173'),
  
  // Features
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
  MAX_MESSAGES_PER_MINUTE: parseInt(process.env.MAX_MESSAGES_PER_MINUTE || '30'),
  
  // Is production
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const;

// Validate configuration on load
export function validateEnvironment(): void {
  console.log('\n🔍 Validating environment configuration...\n');
  
  // Validate JWT secrets
  validateJWTSecret(env.JWT_SECRET, 'JWT_SECRET');
  validateJWTSecret(env.JWT_REFRESH_SECRET, 'JWT_REFRESH_SECRET');
  
  // Validate URLs
  if (!env.MONGODB_URI.startsWith('mongodb://') && !env.MONGODB_URI.startsWith('mongodb+srv://')) {
    throw new Error('❌ MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }
  
  if (!env.REDIS_URL.startsWith('redis://') && !env.REDIS_URL.startsWith('rediss://')) {
    throw new Error('❌ REDIS_URL must start with redis:// or rediss://');
  }
  
  // Validate port
  if (env.PORT < 1024 || env.PORT > 65535) {
    throw new Error('❌ PORT must be between 1024 and 65535');
  }
  
  // Production-specific validations
  if (env.IS_PRODUCTION) {
    if (env.CORS_ORIGIN === '*') {
      throw new Error('❌ CORS_ORIGIN cannot be "*" in production!');
    }
    
    if (env.JWT_SECRET.length < 64) {
      throw new Error('❌ JWT_SECRET must be at least 64 characters in production!');
    }
  }
  
  console.log('✅ Environment configuration validated successfully\n');
  console.log(`📋 Configuration:`);
  console.log(`   • Environment: ${env.NODE_ENV}`);
  console.log(`   • Server ID: ${env.SERVER_ID}`);
  console.log(`   • Port: ${env.PORT}`);
  console.log(`   • MongoDB: ${env.MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
  console.log(`   • Redis: ${env.REDIS_URL.replace(/\/\/.*@/, '//***@')}`);
  console.log(`   • CORS Origin: ${env.CORS_ORIGIN}`);
  console.log(`   • Rate Limiting: ${env.ENABLE_RATE_LIMITING ? 'Enabled' : 'Disabled'}\n`);
}
