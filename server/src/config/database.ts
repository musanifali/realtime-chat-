// server/src/config/database.ts

import mongoose from 'mongoose';
import { env } from './env.js';

const MONGODB_URI = env.MONGODB_URI;

export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB connected successfully to ${MONGODB_URI.replace(/\/\/.*@/, '//***@')}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    console.error('Make sure MongoDB is running and MONGODB_URI is correctly set');
    process.exit(1);
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB disconnected');
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('MongoDB connection established');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});
