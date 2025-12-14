// server/src/models/Friendship.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IFriendship extends Document {
  requester: mongoose.Types.ObjectId; // User who sent the request
  recipient: mongoose.Types.ObjectId; // User who received the request
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  createdAt: Date;
  updatedAt: Date;
}

const FriendshipSchema = new Schema<IFriendship>(
  {
    requester: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'blocked'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate friend requests
FriendshipSchema.index({ requester: 1, recipient: 1 }, { unique: true });

// Index for faster queries
FriendshipSchema.index({ requester: 1, status: 1 });
FriendshipSchema.index({ recipient: 1, status: 1 });

// Define statics interface
interface IFriendshipModel extends mongoose.Model<IFriendship> {
  areFriends(userId1: string, userId2: string): Promise<boolean>;
  getFriendshipStatus(userId1: string, userId2: string): Promise<string | null>;
}

// Static method to check if users are friends
FriendshipSchema.statics.areFriends = async function (
  userId1: string,
  userId2: string
): Promise<boolean> {
  const friendship = await this.findOne({
    status: 'accepted',
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 },
    ],
  });
  return !!friendship;
};

// Static method to get friendship status between two users
FriendshipSchema.statics.getFriendshipStatus = async function (
  userId1: string,
  userId2: string
): Promise<string | null> {
  const friendship = await this.findOne({
    $or: [
      { requester: userId1, recipient: userId2 },
      { requester: userId2, recipient: userId1 },
    ],
  });
  return friendship ? friendship.status : null;
};

export const Friendship = mongoose.model<IFriendship, IFriendshipModel>('Friendship', FriendshipSchema);
