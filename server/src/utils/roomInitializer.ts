// server/src/utils/roomInitializer.ts

import { RedisService } from '../services/RedisService.js';
import { DEFAULT_ROOMS, SERVER_ID } from '../config/constants.js';

export async function initializeRooms(redisService: RedisService): Promise<void> {
  for (const room of DEFAULT_ROOMS) {
    if (!(await redisService.roomExists(room))) {
      await redisService.addRoom(room);
      console.log(`${SERVER_ID}: Created default room #${room}`);
    }
  }
}
