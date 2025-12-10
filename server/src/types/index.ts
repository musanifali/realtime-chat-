// server/src/types/index.ts

export interface ClientToServerEvents {
  register: (username: string) => void;
  join_room: (room: string) => void;
  leave_room: (room: string) => void;
  create_room: (room: string) => void;
  room_message: (data: { room: string; message: string }) => void;
  private_message: (data: { to: string; message: string }) => void;
  get_room_users: (room: string) => void;
}

export interface ServerToClientEvents {
  room_message: (data: { room: string; username: string; message: string }) => void;
  private_message: (data: { from: string; to: string; message: string }) => void;
  room_list: (rooms: string[]) => void;
  room_users: (data: { room: string; users: string[] }) => void;
  user_list: (users: string[]) => void;
  system: (message: string) => void;
  room_system: (data: { room: string; message: string }) => void;
  error: (message: string) => void;
  joined_room: (room: string) => void;
  left_room: (room: string) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  username: string;
  rooms: Set<string>;
}

export type RedisMessage =
  | { type: 'room_message'; room: string; username: string; message: string }
  | { type: 'private_message'; from: string; to: string; message: string }
  | { type: 'user_joined'; username: string }
  | { type: 'user_left'; username: string }
  | { type: 'room_created'; room: string; creator: string }
  | { type: 'user_joined_room'; room: string; username: string }
  | { type: 'user_left_room'; room: string; username: string };
