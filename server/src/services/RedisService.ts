// server/src/services/RedisService.ts

import { createClient, RedisClientType } from 'redis';
import { USERS_KEY } from '../config/constants.js';

export class RedisService {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;

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
      console.warn('Failed to parse Redis URL, using as-is:', redisUrl);
    }

    console.log('Redis config:', { url: cleanUrl, username, hasPassword: !!password });

    const config = { 
      url: cleanUrl,
      username,
      password,
      socket: { 
        reconnectStrategy: () => 1000 
      }
    };
    this.publisher = createClient(config);
    // Create subscriber separately instead of duplicating (fixes NOAUTH issue)
    this.subscriber = createClient(config);
  }

  async connect(): Promise<void> {
    await this.publisher.connect();
    await this.subscriber.connect();
  }

  async disconnect(): Promise<void> {
    await this.publisher.quit();
    await this.subscriber.quit();
  }

  getPublisher(): RedisClientType {
    return this.publisher;
  }

  getSubscriber(): RedisClientType {
    return this.subscriber;
  }

  // User methods
  async addUser(username: string): Promise<void> {
    if (!this.publisher.isOpen) {
      console.log('⚠️ Redis publisher closed, skipping addUser');
      return;
    }
    await this.publisher.sAdd(USERS_KEY, username);
  }

  async removeUser(username: string): Promise<void> {
    if (!this.publisher.isOpen) {
      console.log('⚠️ Redis publisher closed, skipping removeUser');
      return;
    }
    await this.publisher.sRem(USERS_KEY, username);
  }

  async getAllUsers(): Promise<string[]> {
    if (!this.publisher.isOpen) {
      console.log('⚠️ Redis publisher closed, returning empty users list');
      return [];
    }
    return await this.publisher.sMembers(USERS_KEY);
  }

  async isUsernameTaken(username: string): Promise<boolean> {
    if (!this.publisher.isOpen) {
      console.log('⚠️ Redis publisher closed, returning false for isUsernameTaken');
      return false;
    }
    return (await this.publisher.sIsMember(USERS_KEY, username)) === 1;
  }



  // Pub/Sub methods
  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel, handler);
  }

  // Cleanup methods
  async cleanupOnStartup(): Promise<void> {
    // Clear all active users (they should reconnect)
    await this.publisher.del(USERS_KEY);
    console.log('Redis cleanup completed: Cleared all users');
  }
}
