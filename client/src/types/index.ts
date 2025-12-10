// client/src/types/index.ts

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

export interface ClientToServerEvents {
  register: (username: string) => void;
  join_room: (room: string) => void;
  leave_room: (room: string) => void;
  create_room: (room: string) => void;
  room_message: (data: { room: string; message: string }) => void;
  private_message: (data: { to: string; message: string }) => void;
  get_room_users: (room: string) => void;
}

export interface ChatMessage {
  id: string;
  type: 'message' | 'system' | 'private_sent' | 'private_received';
  room?: string;
  username?: string;
  text: string;
  timestamp: Date;
}

export type ChatTarget = 
  | { type: 'room'; room: string }
  | { type: 'user'; username: string };

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string;
  username: string;
}

export interface ChatState {
  messages: ChatMessage[];
  chatTarget: ChatTarget;
}

export interface RoomState {
  allRooms: string[];
  myRooms: Set<string>;
  roomUsers: Map<string, string[]>;
}

export interface UserState {
  allUsers: string[];
}
