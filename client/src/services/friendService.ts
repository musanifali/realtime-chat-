// client/src/services/friendService.ts

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

axios.defaults.withCredentials = true;

export interface Friend {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  friendshipId: string;
}

export interface FriendRequest {
  id: string;
  requester: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: Date;
}

export interface SentRequest {
  id: string;
  recipient: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: Date;
}

export interface SearchResult {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  friendshipStatus: 'pending' | 'accepted' | 'rejected' | 'blocked' | null;
  friendshipId?: string;
  isRequester: boolean;
}

export const friendService = {
  // Send friend request
  async sendRequest(recipientId: string) {
    const response = await axios.post(`${API_URL}/friends/request`, { recipientId });
    return response.data;
  },

  // Accept friend request
  async acceptRequest(friendshipId: string) {
    const response = await axios.put(`${API_URL}/friends/request/${friendshipId}/accept`);
    return response.data;
  },

  // Reject friend request
  async rejectRequest(friendshipId: string) {
    const response = await axios.put(`${API_URL}/friends/request/${friendshipId}/reject`);
    return response.data;
  },

  // Get friends list
  async getFriends(): Promise<{ friends: Friend[] }> {
    const response = await axios.get(`${API_URL}/friends/list`);
    return response.data;
  },

  // Remove friend
  async removeFriend(friendId: string) {
    const response = await axios.delete(`${API_URL}/friends/${friendId}`);
    return response.data;
  },

  // Get pending friend requests (received)
  async getPendingRequests(): Promise<{ requests: FriendRequest[] }> {
    const response = await axios.get(`${API_URL}/friends/requests/pending`);
    return response.data;
  },

  // Get sent friend requests
  async getSentRequests(): Promise<{ requests: SentRequest[] }> {
    const response = await axios.get(`${API_URL}/friends/requests/sent`);
    return response.data;
  },

  // Block user
  async blockUser(blockedUserId: string) {
    const response = await axios.post(`${API_URL}/friends/block`, { blockedUserId });
    return response.data;
  },

  // Unblock user
  async unblockUser(blockedUserId: string) {
    const response = await axios.post(`${API_URL}/friends/unblock`, { blockedUserId });
    return response.data;
  },

  // Get blocked users
  async getBlockedUsers() {
    const response = await axios.get(`${API_URL}/friends/blocked`);
    return response.data;
  },

  // Search users
  async searchUsers(query: string): Promise<{ users: SearchResult[] }> {
    const response = await axios.get(`${API_URL}/friends/search`, {
      params: { query },
    });
    return response.data;
  },
};
