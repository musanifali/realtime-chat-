// server/src/types/index.ts

export interface ClientToServerEvents {
  register: (username: string) => void;
  private_message: (data: { to: string; message: string; tempId?: string }) => void;
  typing_start: (data: { to: string }) => void;
  typing_stop: (data: { to: string }) => void;
  friend_request_sent: (data: { requestId: string; recipientId: string; requester: any }) => void;
  friend_request_accepted: (data: { friendshipId: string; requesterId: string; friend: any }) => void;
  friend_removed: (data: { friendId: string; userId: string }) => void;
}

export interface ServerToClientEvents {
  private_message: (data: { from: string; to: string; message: string; messageId?: string }) => void;
  message_sent: (data: { tempId: string; messageId: string; to: string; timestamp: Date }) => void;
  user_list: (users: string[]) => void;
  system: (message: string) => void;
  error: (message: string) => void;
  typing_start: (data: { username: string }) => void;
  typing_stop: (data: { username: string }) => void;
  friend_request_received: (data: { requestId: string; recipientId: string; requester: any }) => void;
  friend_request_accepted: (data: { friendshipId: string; requesterId: string; friend: any }) => void;
  friend_removed: (data: { friendId: string; userId: string }) => void;
  friend_status_changed: (data: { username: string; status: string }) => void;
}

export interface InterServerEvents {}

export interface SocketData {
  userId?: string;
  username: string;
  email?: string;
}

export type RedisMessage =
  | { type: 'private_message'; from: string; to: string; message: string; messageId?: string }
  | { type: 'user_joined'; username: string }
  | { type: 'user_left'; username: string }
  | { type: 'typing_start'; from: string; to: string }
  | { type: 'typing_stop'; from: string; to: string }
  | { type: 'friend_status_changed'; username: string; status: string; to: string };
