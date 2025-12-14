// client/src/services/authService.ts

import axios from 'axios';

// Use relative path for production (nginx proxy), localhost for dev
const API_URL = import.meta.env.VITE_API_URL || 
  (import.meta.env.DEV ? 'http://localhost:3001/api' : '/api');

axios.defaults.withCredentials = true; // Enable cookies

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  status: 'online' | 'offline' | 'away';
}

export interface AuthResponse {
  message: string;
  user: User;
  accessToken: string;
}

class AuthService {
  private accessToken: string | null = null;

  constructor() {
    // Load token from localStorage on init
    this.accessToken = localStorage.getItem('accessToken');
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/register`, data);
    this.accessToken = response.data.accessToken;
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  }

  /**
   * Login user
   */
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await axios.post<AuthResponse>(`${API_URL}/auth/login`, data);
    this.accessToken = response.data.accessToken;
    localStorage.setItem('accessToken', response.data.accessToken);
    return response.data;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await axios.post(`${API_URL}/auth/logout`);
    this.accessToken = null;
    localStorage.removeItem('accessToken');
  }

  /**
   * Get current user
   */
  async getMe(): Promise<User> {
    const response = await axios.get<{ user: User }>(`${API_URL}/auth/me`);
    return response.data.user;
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const response = await axios.post<{ accessToken: string }>(`${API_URL}/auth/refresh`);
    this.accessToken = response.data.accessToken;
    return response.data.accessToken;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: { displayName?: string; avatar?: string; bio?: string }): Promise<User> {
    const response = await axios.put<{ user: User }>(`${API_URL}/auth/profile`, data);
    return response.data.user;
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.accessToken !== null;
  }
}

export const authService = new AuthService();
