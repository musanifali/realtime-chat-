// client/src/types/index.ts

export interface ServerToClientEvents {
  private_message: (data: { from: string; to: string; message: string }) => void;
  user_list: (users: string[]) => void;
  system: (message: string) => void;
  error: (message: string) => void;
  typing_start: (data: { username: string }) => void;
  typing_stop: (data: { username: string }) => void;
}

export interface ClientToServerEvents {
  register: (username: string) => void;
  private_message: (data: { to: string; message: string }) => void;
  typing_start: (data: { to: string }) => void;
  typing_stop: (data: { to: string }) => void;
}

export interface ChatMessage {
  id: string;
  type: 'system' | 'private_sent' | 'private_received';
  username?: string;
  text: string;
  timestamp: Date;
}

export type ChatTarget = { type: 'user'; username: string };

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string;
  username: string;
}

export interface ChatState {
  messages: ChatMessage[];
  chatTarget: ChatTarget | null;
}

export interface UserState {
  allUsers: string[];
}
