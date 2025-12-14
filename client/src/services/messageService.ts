// client/src/services/messageService.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

axios.defaults.withCredentials = true;

export interface MessageData {
  id: string;
  message: string;
  sender: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  recipient: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface UnreadCount {
  username: string;
  count: number;
}

export const messageService = {
  // Get message history with a friend
  async getHistory(friendUsername: string, limit = 50, before?: string) {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) {
      params.append('before', before);
    }
    const response = await axios.get<{ messages: MessageData[] }>(
      `${API_URL}/messages/history/${friendUsername}?${params}`
    );
    return response.data;
  },

  // Mark messages from a friend as read
  async markAsRead(friendUsername: string) {
    const response = await axios.post<{ message: string; count: number }>(
      `${API_URL}/messages/read/${friendUsername}`
    );
    return response.data;
  },

  // Get total unread count
  async getUnreadCount() {
    const response = await axios.get<{ count: number }>(`${API_URL}/messages/unread/count`);
    return response.data;
  },

  // Get unread counts by friend
  async getUnreadCountsByFriend() {
    const response = await axios.get<{ counts: UnreadCount[] }>(
      `${API_URL}/messages/unread/by-friend`
    );
    return response.data;
  },
};
