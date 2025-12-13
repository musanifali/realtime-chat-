// server/src/services/RedisService.ts

import { createClient, RedisClientType } from 'redis';
import { USERS_KEY } from '../config/constants.js';

export class RedisService {
  private publisher: RedisClientType;
  private subscriber: RedisClientType;

  constructor(redisUrl: string) {
    this.publisher = createClient({ url: redisUrl });
    this.subscriber = createClient({ url: redisUrl });
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
    await this.publisher.sAdd(USERS_KEY, username);
  }

  async removeUser(username: string): Promise<void> {
    await this.publisher.sRem(USERS_KEY, username);
  }

  async getAllUsers(): Promise<string[]> {
    return await this.publisher.sMembers(USERS_KEY);
  }

  async isUsernameTaken(username: string): Promise<boolean> {
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
