// server/src/routes/messages.ts

import { Router } from 'express';
import { MessageController } from '../controllers/MessageController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All message routes require authentication
router.use(authenticate);

// Get message history with a friend
router.get('/history/:friendUsername', MessageController.getMessageHistory);

// Mark messages from a friend as read
router.post('/read/:friendUsername', MessageController.markMessagesAsRead);

// Get total unread message count
router.get('/unread/count', MessageController.getUnreadCount);

// Get unread counts grouped by friend
router.get('/unread/by-friend', MessageController.getUnreadCountsByFriend);

export default router;
