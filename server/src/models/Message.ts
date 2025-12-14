// server/src/models/Message.ts

import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  recipient: mongoose.Types.ObjectId;
  message: string;
  friendship: mongoose.Types.ObjectId;
  reactions?: Array<{
    userId: mongoose.Types.ObjectId;
    emoji: string;
    createdAt: Date;
  }>;
  isDelivered: boolean;
  deliveredAt?: Date;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [5000, 'Message must be less than 5000 characters'],
    },
    friendship: {
      type: Schema.Types.ObjectId,
      ref: 'Friendship',
      required: true,
      index: true,
    },
    reactions: [{
      userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      emoji: {
        type: String,
        required: true,
      },
      createdAt: {
        type: Date,
        default: Date.now,
      }
    }],
    isDelivered: {
      type: Boolean,
      default: false,
      index: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
MessageSchema.index({ friendship: 1, createdAt: -1 });
MessageSchema.index({ recipient: 1, isRead: 1 });
MessageSchema.index({ recipient: 1, isDelivered: 1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);
