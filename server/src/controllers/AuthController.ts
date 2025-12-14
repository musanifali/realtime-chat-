// server/src/controllers/AuthController.ts

import { Request, Response } from 'express';
import { User, IUser } from '../models/User.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: false, // Set to true only if using HTTPS
  sameSite: 'lax' as const, // 'lax' works better for same-site requests through proxy
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export class AuthController {
  /**
   * Register new user
   * POST /api/auth/register
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      console.log('📝 Register request body:', req.body);
      console.log('📝 Request headers:', req.headers);
      
      const { username, email, password, displayName } = req.body;

      // Validate required fields
      if (!username || !email || !password || !displayName) {
        console.log('❌ Validation failed - missing fields:', { username: !!username, email: !!email, password: !!password, displayName: !!displayName });
        res.status(400).json({ error: 'All fields are required' });
        return;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }],
      });

      if (existingUser) {
        if (existingUser.username === username.toLowerCase()) {
          res.status(400).json({ error: 'Username already taken' });
        } else {
          res.status(400).json({ error: 'Email already registered' });
        }
        return;
      }

      // Validate password strength
      if (password.length < 8) {
        res.status(400).json({ error: 'Password must be at least 8 characters' });
        return;
      }

      // Create new user
      const user = new User({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password, // Will be hashed by the pre-save hook
        displayName,
        status: 'offline',
      });

      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set cookies
      res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 }); // 15 min
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS); // 7 days

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
        },
        accessToken,
      });
    } catch (error: any) {
      console.error('Registration error:', error);

      // Handle validation errors
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        res.status(400).json({ error: messages[0] });
        return;
      }

      res.status(500).json({ error: 'Registration failed' });
    }
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Validate input
      if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
      }

      // Find user (include password for comparison)
      const user = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: username.toLowerCase() }],
      }).select('+password');

      if (!user) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid username or password' });
        return;
      }

      // Update user status
      user.status = 'online';
      user.lastSeen = new Date();
      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      // Set cookies
      res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });
      res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          status: user.status,
        },
        accessToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  /**
   * Logout user
   * POST /api/auth/logout
   */
  static async logout(req: Request, res: Response): Promise<void> {
    try {
      // Update user status to offline
      if (req.user) {
        await User.findByIdAndUpdate(req.user.userId, {
          status: 'offline',
          lastSeen: new Date(),
        });
      }

      // Clear cookies
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  /**
   * Refresh access token
   * POST /api/auth/refresh
   */
  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ error: 'Refresh token is missing' });
        return;
      }

      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);
      if (!payload) {
        res.status(401).json({ error: 'Invalid or expired refresh token' });
        return;
      }

      // Get user
      const user = await User.findById(payload.userId);
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Generate new access token
      const newAccessToken = generateAccessToken(user);

      // Set new access token cookie
      res.cookie('accessToken', newAccessToken, { ...COOKIE_OPTIONS, maxAge: 15 * 60 * 1000 });

      res.json({
        message: 'Token refreshed',
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }

  /**
   * Get current user info
   * GET /api/auth/me
   */
  static async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
          status: user.status,
          lastSeen: user.lastSeen,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Failed to fetch user' });
    }
  }

  /**
   * Update user profile
   * PUT /api/auth/profile
   */
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const { displayName, avatar, bio } = req.body;

      const user = await User.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Update fields if provided
      if (displayName) user.displayName = displayName;
      if (avatar !== undefined) user.avatar = avatar;
      if (bio !== undefined) user.bio = bio;

      await user.save();

      res.json({
        message: 'Profile updated successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          bio: user.bio,
        },
      });
    } catch (error: any) {
      console.error('Profile update error:', error);

      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((err: any) => err.message);
        res.status(400).json({ error: messages[0] });
        return;
      }

      res.status(500).json({ error: 'Profile update failed' });
    }
  }
}
