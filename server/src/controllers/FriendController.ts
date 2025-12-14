// server/src/controllers/FriendController.ts

import { Request, Response } from 'express';
import { Friendship } from '../models/Friendship.js';
import { User } from '../models/User.js';
import mongoose from 'mongoose';

export class FriendController {
  // Send friend request
  static async sendRequest(req: Request, res: Response): Promise<void> {
    try {
      const requesterId = req.user!.userId;
      const { recipientId } = req.body;

      // Validate recipient ID
      if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
        res.status(400).json({ error: 'Invalid recipient ID' });
        return;
      }

      // Check if recipient exists
      const recipient = await User.findById(recipientId);
      if (!recipient) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Can't send request to yourself
      if (requesterId === recipientId) {
        res.status(400).json({ error: 'Cannot send friend request to yourself' });
        return;
      }

      // Check if friendship already exists
      const existing = await Friendship.findOne({
        $or: [
          { requester: requesterId, recipient: recipientId },
          { requester: recipientId, recipient: requesterId },
        ],
      });

      if (existing) {
        if (existing.status === 'pending') {
          res.status(400).json({ error: 'Friend request already sent' });
          return;
        }
        if (existing.status === 'accepted') {
          res.status(400).json({ error: 'Already friends' });
          return;
        }
        if (existing.status === 'blocked') {
          res.status(403).json({ error: 'Cannot send request to this user' });
          return;
        }
        // If rejected, allow sending again by updating status
        existing.status = 'pending';
        existing.requester = new mongoose.Types.ObjectId(requesterId);
        existing.recipient = new mongoose.Types.ObjectId(recipientId);
        await existing.save();
        res.status(200).json({ message: 'Friend request sent', friendship: existing });
        return;
      }

      // Create new friend request
      const friendship = await Friendship.create({
        requester: requesterId,
        recipient: recipientId,
        status: 'pending',
      });

      res.status(201).json({ message: 'Friend request sent', friendship });
    } catch (error: any) {
      console.error('Send friend request error:', error);
      res.status(500).json({ error: 'Failed to send friend request' });
    }
  }

  // Accept friend request
  static async acceptRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { friendshipId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(friendshipId)) {
        res.status(400).json({ error: 'Invalid friendship ID' });
        return;
      }

      const friendship = await Friendship.findById(friendshipId);
      
      if (!friendship) {
        res.status(404).json({ error: 'Friend request not found' });
        return;
      }

      // Only recipient can accept
      if (friendship.recipient.toString() !== userId) {
        res.status(403).json({ error: 'Not authorized to accept this request' });
        return;
      }

      if (friendship.status !== 'pending') {
        res.status(400).json({ error: 'Request is not pending' });
        return;
      }

      friendship.status = 'accepted';
      await friendship.save();

      // Populate user details
      await friendship.populate('requester', 'username displayName avatar');
      await friendship.populate('recipient', 'username displayName avatar');

      res.status(200).json({ message: 'Friend request accepted', friendship });
    } catch (error: any) {
      console.error('Accept friend request error:', error);
      res.status(500).json({ error: 'Failed to accept friend request' });
    }
  }

  // Reject friend request
  static async rejectRequest(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { friendshipId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(friendshipId)) {
        res.status(400).json({ error: 'Invalid friendship ID' });
        return;
      }

      const friendship = await Friendship.findById(friendshipId);
      
      if (!friendship) {
        res.status(404).json({ error: 'Friend request not found' });
        return;
      }

      // Only recipient can reject
      if (friendship.recipient.toString() !== userId) {
        res.status(403).json({ error: 'Not authorized to reject this request' });
        return;
      }

      if (friendship.status !== 'pending') {
        res.status(400).json({ error: 'Request is not pending' });
        return;
      }

      friendship.status = 'rejected';
      await friendship.save();

      res.status(200).json({ message: 'Friend request rejected' });
    } catch (error: any) {
      console.error('Reject friend request error:', error);
      res.status(500).json({ error: 'Failed to reject friend request' });
    }
  }

  // Block user
  static async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { blockedUserId } = req.body;

      if (!blockedUserId || !mongoose.Types.ObjectId.isValid(blockedUserId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      if (userId === blockedUserId) {
        res.status(400).json({ error: 'Cannot block yourself' });
        return;
      }

      // Find or create friendship record
      let friendship = await Friendship.findOne({
        $or: [
          { requester: userId, recipient: blockedUserId },
          { requester: blockedUserId, recipient: userId },
        ],
      });

      if (friendship) {
        friendship.status = 'blocked';
        friendship.requester = new mongoose.Types.ObjectId(userId);
        friendship.recipient = new mongoose.Types.ObjectId(blockedUserId);
        await friendship.save();
      } else {
        friendship = await Friendship.create({
          requester: userId,
          recipient: blockedUserId,
          status: 'blocked',
        });
      }

      res.status(200).json({ message: 'User blocked', friendship });
    } catch (error: any) {
      console.error('Block user error:', error);
      res.status(500).json({ error: 'Failed to block user' });
    }
  }

  // Unblock user
  static async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { blockedUserId } = req.body;

      if (!blockedUserId || !mongoose.Types.ObjectId.isValid(blockedUserId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      const friendship = await Friendship.findOne({
        requester: userId,
        recipient: blockedUserId,
        status: 'blocked',
      });

      if (!friendship) {
        res.status(404).json({ error: 'User is not blocked' });
        return;
      }

      await friendship.deleteOne();

      res.status(200).json({ message: 'User unblocked' });
    } catch (error: any) {
      console.error('Unblock user error:', error);
      res.status(500).json({ error: 'Failed to unblock user' });
    }
  }

  // Remove friend
  static async removeFriend(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { friendId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(friendId)) {
        res.status(400).json({ error: 'Invalid friend ID' });
        return;
      }

      const friendship = await Friendship.findOne({
        status: 'accepted',
        $or: [
          { requester: userId, recipient: friendId },
          { requester: friendId, recipient: userId },
        ],
      });

      if (!friendship) {
        res.status(404).json({ error: 'Friendship not found' });
        return;
      }

      await friendship.deleteOne();

      res.status(200).json({ message: 'Friend removed' });
    } catch (error: any) {
      console.error('Remove friend error:', error);
      res.status(500).json({ error: 'Failed to remove friend' });
    }
  }

  // Get friends list
  static async getFriends(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const friendships = await Friendship.find({
        status: 'accepted',
        $or: [{ requester: userId }, { recipient: userId }],
      })
        .populate('requester', 'username displayName avatar status lastSeen')
        .populate('recipient', 'username displayName avatar status lastSeen')
        .sort({ updatedAt: -1 });

      // Extract friend data (not the current user)
      const friends = friendships.map((f) => {
        const friend = f.requester._id.toString() === userId ? f.recipient : f.requester;
        const friendData = friend as any; // Populated user document
        return {
          id: friendData._id,
          username: friendData.username,
          displayName: friendData.displayName,
          avatar: friendData.avatar,
          status: friendData.status,
          lastSeen: friendData.lastSeen,
          friendshipId: f._id,
        };
      });

      res.status(200).json({ friends });
    } catch (error: any) {
      console.error('Get friends error:', error);
      res.status(500).json({ error: 'Failed to get friends list' });
    }
  }

  // Get pending friend requests (received)
  static async getPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const requests = await Friendship.find({
        recipient: userId,
        status: 'pending',
      })
        .populate('requester', 'username displayName avatar')
        .sort({ createdAt: -1 });

      const pendingRequests = requests.map((r) => {
        const requester = r.requester as any; // Populated user document
        return {
          id: r._id,
          requester: {
            id: requester._id,
            username: requester.username,
            displayName: requester.displayName,
            avatar: requester.avatar,
          },
          createdAt: r.createdAt,
        };
      });

      res.status(200).json({ requests: pendingRequests });
    } catch (error: any) {
      console.error('Get pending requests error:', error);
      res.status(500).json({ error: 'Failed to get pending requests' });
    }
  }

  // Get sent friend requests
  static async getSentRequests(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const requests = await Friendship.find({
        requester: userId,
        status: 'pending',
      })
        .populate('recipient', 'username displayName avatar')
        .sort({ createdAt: -1 });

      const sentRequests = requests.map((r) => {
        const recipient = r.recipient as any; // Populated user document
        return {
          id: r._id,
          recipient: {
            id: recipient._id,
            username: recipient.username,
            displayName: recipient.displayName,
            avatar: recipient.avatar,
          },
          createdAt: r.createdAt,
        };
      });

      res.status(200).json({ requests: sentRequests });
    } catch (error: any) {
      console.error('Get sent requests error:', error);
      res.status(500).json({ error: 'Failed to get sent requests' });
    }
  }

  // Get blocked users
  static async getBlockedUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;

      const blocked = await Friendship.find({
        requester: userId,
        status: 'blocked',
      })
        .populate('recipient', 'username displayName avatar')
        .sort({ createdAt: -1 });

      const blockedUsers = blocked.map((b) => {
        const recipient = b.recipient as any; // Populated user document
        return {
          id: recipient._id,
          username: recipient.username,
          displayName: recipient.displayName,
          avatar: recipient.avatar,
          friendshipId: b._id,
        };
      });

      res.status(200).json({ blockedUsers });
    } catch (error: any) {
      console.error('Get blocked users error:', error);
      res.status(500).json({ error: 'Failed to get blocked users' });
    }
  }

  // Search users (excluding friends and blocked users)
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        res.status(400).json({ error: 'Search query is required' });
        return;
      }

      // Find users matching the query
      const users = await User.find({
        _id: { $ne: userId }, // Exclude current user
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { displayName: { $regex: query, $options: 'i' } },
        ],
      })
        .select('username displayName avatar bio')
        .limit(20);

      // Get friendship status for each user
      const userIds = users.map((u) => u._id.toString());
      const friendships = await Friendship.find({
        $or: [
          { requester: userId, recipient: { $in: userIds } },
          { requester: { $in: userIds }, recipient: userId },
        ],
      });

      // Map friendship status
      const friendshipMap = new Map();
      friendships.forEach((f) => {
        const otherId = f.requester.toString() === userId ? f.recipient.toString() : f.requester.toString();
        friendshipMap.set(otherId, {
          status: f.status,
          friendshipId: f._id,
          isRequester: f.requester.toString() === userId,
        });
      });

      const results = users.map((u) => {
        const friendship = friendshipMap.get(u._id.toString());
        return {
          id: u._id,
          username: u.username,
          displayName: u.displayName,
          avatar: u.avatar,
          bio: u.bio,
          friendshipStatus: friendship?.status || null,
          friendshipId: friendship?.friendshipId || null,
          isRequester: friendship?.isRequester || false,
        };
      });

      res.status(200).json({ users: results });
    } catch (error: any) {
      console.error('Search users error:', error);
      res.status(500).json({ error: 'Failed to search users' });
    }
  }
}
