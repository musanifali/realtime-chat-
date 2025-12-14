// server/src/services/RedisService.ts

import { createClient, RedisClientType } from 'redis';
import { USERS_KEY } from '../config/constants.js';

export class RedisService {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;
  private cleanupInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private isShuttingDown = false;

  constructor(redisUrl: string) {
    // Parse URL to extract username/password (Redis v5 client needs explicit config)
    let username: string | undefined;
    let password: string | undefined;
    let cleanUrl = redisUrl;

    try {
      const url = new URL(redisUrl);
      if (url.username) username = url.username;
      if (url.password) password = url.password;
      // Reconstruct URL without credentials
      cleanUrl = `redis://${url.host}${url.pathname}`;
    } catch (e) {
      // URL parsing failed, use as-is
      console.warn('⚠️  Failed to parse Redis URL, using as-is:', redisUrl);
    }

    console.log('📋 Redis config:', { url: cleanUrl, username, hasPassword: !!password });

    const config = { 
      url: cleanUrl,
      username,
      password,
      socket: { 
        reconnectStrategy: (retries: number) => {
          if (this.isShuttingDown) {
            return false; // Don't reconnect during shutdown
          }
          if (retries > this.MAX_RECONNECT_ATTEMPTS) {
            console.error('❌ Redis max reconnection attempts reached');
            return new Error('Max reconnection attempts reached');
          }
          const delay = Math.min(retries * 500, 5000); // Exponential backoff, max 5s
          console.log(`🔄 Redis reconnecting in ${delay}ms (attempt ${retries})...`);
          this.reconnectAttempts = retries;
          return delay;
        },
        connectTimeout: 10000,
        keepAlive: true
      }
    };
    this.publisher = createClient(config);
    this.subscriber = createClient(config);
    
    // Set up error handlers
    this.setupErrorHandlers();
  }

  private setupErrorHandlers(): void {
    this.publisher.on('error', (err) => {
      console.error('❌ Redis Publisher Error:', err.message);
    });

    this.subscriber.on('error', (err) => {
      console.error('❌ Redis Subscriber Error:', err.message);
    });

    this.publisher.on('reconnecting', () => {
      console.log('🔄 Redis Publisher reconnecting...');
    });

    this.subscriber.on('reconnecting', () => {
      console.log('🔄 Redis Subscriber reconnecting...');
    });

    this.publisher.on('ready', () => {
      console.log('✅ Redis Publisher ready');
      this.reconnectAttempts = 0;
    });

    this.subscriber.on('ready', () => {
      console.log('✅ Redis Subscriber ready');
    });
  }

  async connect(): Promise<void> {
    try {
      console.log('🔌 Connecting to Redis...');
      await this.publisher.connect();
      await this.subscriber.connect();
      console.log('✅ Redis connected successfully');
      
      // Start periodic cleanup (every 5 minutes)
      this.startPeriodicCleanup();
    } catch (error: any) {
      console.error('❌ Failed to connect to Redis:', error.message);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.isShuttingDown = true;
    
    // Stop periodic cleanup
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    console.log('🔌 Disconnecting from Redis...');
    try {
      await this.publisher.quit();
      await this.subscriber.quit();
      console.log('✅ Redis disconnected cleanly');
    } catch (error: any) {
      console.error('⚠️  Error during Redis disconnect:', error.message);
    }
  }

  isConnected(): boolean {
    return this.publisher.isOpen && this.subscriber.isOpen;
  }

  private startPeriodicCleanup(): void {
    // Clean up stale data every 5 minutes
    this.cleanupInterval = setInterval(async () => {
      try {
        await this.cleanupStaleData();
      } catch (error: any) {
        console.error('❌ Periodic cleanup failed:', error.message);
      }
    }, 5 * 60 * 1000);
  }

  private async cleanupStaleData(): Promise<void> {
    if (!this.isConnected()) {
      console.warn('⚠️  Redis not connected, skipping cleanup');
      return;
    }
    
    console.log('🧹 Running Redis cleanup...');
    // Could add logic here to remove stale users, expired sessions, etc.
    const userCount = await this.publisher.sCard(USERS_KEY);
    console.log(`📊 Current online users: ${userCount}`);
  }

  getPublisher(): RedisClientType {
    return this.publisher;
  }

  getSubscriber(): RedisClientType {
    return this.subscriber;
  }

  // User methods with safe error handling
  async addUser(username: string): Promise<void> {
    if (!this.isConnected()) {
      console.warn('⚠️  Redis not connected, cannot add user');
      return;
    }
    try {
      await this.publisher.sAdd(USERS_KEY, username);
    } catch (error: any) {
      console.error('❌ Failed to add user to Redis:', error.message);
    }
  }

  async removeUser(username: string): Promise<void> {
    if (!this.isConnected()) {
      console.warn('⚠️  Redis not connected, cannot remove user');
      return;
    }
    try {
      await this.publisher.sRem(USERS_KEY, username);
    } catch (error: any) {
      console.error('❌ Failed to remove user from Redis:', error.message);
    }
  }

  async getAllUsers(): Promise<string[]> {
    if (!this.isConnected()) {
      console.warn('⚠️  Redis not connected, returning empty users list');
      return [];
    }
    try {
      return await this.publisher.sMembers(USERS_KEY);
    } catch (error: any) {
      console.error('❌ Failed to get users from Redis:', error.message);
      return [];
    }
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    if (!this.isConnected()) {
      console.warn('⚠️  Redis not connected, returning false for isUsernameTaken');
      return false;
    }
    try {
      return (await this.publisher.sIsMember(USERS_KEY, username)) === 1;
    } catch (error: any) {
      console.error('❌ Failed to check username in Redis:', error.message);
      return false;
    }
  }



  // Pub/Sub methods with error handling
  async publish(channel: string, message: string): Promise<void> {
    if (!this.isConnected()) {
      console.warn('⚠️  Redis not connected, cannot publish message');
      return;
    }
    try {
      await this.publisher.publish(channel, message);
    } catch (error: any) {
      console.error('❌ Failed to publish to Redis:', error.message);
    }
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Redis not connected, cannot subscribe');
    }
    try {
      await this.subscriber.subscribe(channel, handler);
    } catch (error: any) {
      console.error('❌ Failed to subscribe to Redis channel:', error.message);
      throw error;
    }
  }

  // Cleanup methods
  async cleanupOnStartup(): Promise<void> {
    if (!this.isConnected()) {
      console.warn('⚠️  Redis not connected, skipping startup cleanup');
      return;
    }
    
    try {
      console.log('🧹 Cleaning up stale Redis data from previous session...');
      // Clear all online users from previous sessions
      await this.publisher.del(USERS_KEY);
      console.log('✅ Redis cleanup complete');
    } catch (error: any) {
      console.error('❌ Failed to cleanup Redis on startup:', error.message);
    }
  }
}
