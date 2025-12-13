// server/src/types/index.ts

export interface ClientToServerEvents {
  register: (username: string) => void;
  private_message: (data: { to: string; message: string }) => void;
  typing_start: (data: { to: string }) => void;
  typing_stop: (data: { to: string }) => void;
}

export interface ServerToClientEvents {
  private_message: (data: { from: string; to: string; message: string }) => void;
  user_list: (users: string[]) => void;
  system: (message: string) => void;
  error: (message: string) => void;
  typing_start: (data: { username: string }) => void;
  typing_stop: (data: { username: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  username: string;
}

export type RedisMessage =
  | { type: 'private_message'; from: string; to: string; message: string }
  | { type: 'user_joined'; username: string }
  | { type: 'user_left'; username: string }
  | { type: 'typing_start'; from: string; to: string }
  | { type: 'typing_stop'; from: string; to: string };
