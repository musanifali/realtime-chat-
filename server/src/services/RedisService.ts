// server/src/services/RedisService.ts

import { createClient, RedisClientType } from 'redis';
import { USERS_KEY, ROOMS_KEY } from '../config/constants.js';

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

  // Room methods
  async addRoom(room: string): Promise<void> {
    await this.publisher.sAdd(ROOMS_KEY, room);
  }

  async getAllRooms(): Promise<string[]> {
    return await this.publisher.sMembers(ROOMS_KEY);
  }

  async roomExists(room: string): Promise<boolean> {
    return (await this.publisher.sIsMember(ROOMS_KEY, room)) === 1;
  }

  // Room members methods
  private getRoomMembersKey(room: string): string {
    return `room:${room}:members`;
  }

  async addUserToRoom(room: string, username: string): Promise<void> {
    await this.publisher.sAdd(this.getRoomMembersKey(room), username);
  }

  async removeUserFromRoom(room: string, username: string): Promise<void> {
    await this.publisher.sRem(this.getRoomMembersKey(room), username);
  }

  async getRoomMembers(room: string): Promise<string[]> {
    return await this.publisher.sMembers(this.getRoomMembersKey(room));
  }

  // Pub/Sub methods
  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel, handler);
  }

  // Cleanup methods
  async clearAllUsers(): Promise<void> {
    await this.publisher.del(USERS_KEY);
  }

  async clearAllRoomMembers(): Promise<void> {
    const rooms = await this.getAllRooms();
    for (const room of rooms) {
      await this.publisher.del(this.getRoomMembersKey(room));
    }
  }

  async cleanupOnStartup(): Promise<void> {
    // Clear all active users (they should reconnect)
    await this.clearAllUsers();
    // Clear all room members (they should rejoin)
    await this.clearAllRoomMembers();
    console.log('Redis cleanup completed: Cleared all users and room members');
  }
}
