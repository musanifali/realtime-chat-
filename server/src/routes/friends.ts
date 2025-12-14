// server/src/routes/friends.ts

import { Router } from 'express';
import { FriendController } from '../controllers/FriendController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// All friend routes require authentication
router.use(authenticate);

// Friend request management
router.post('/request', FriendController.sendRequest);
router.put('/request/:friendshipId/accept', FriendController.acceptRequest);
router.put('/request/:friendshipId/reject', FriendController.rejectRequest);

// Friend management
router.get('/list', FriendController.getFriends);
router.delete('/:friendId', FriendController.removeFriend);

// Friend requests
router.get('/requests/pending', FriendController.getPendingRequests);
router.get('/requests/sent', FriendController.getSentRequests);

// Blocking
router.post('/block', FriendController.blockUser);
router.post('/unblock', FriendController.unblockUser);
router.get('/blocked', FriendController.getBlockedUsers);

// User search
router.get('/search', FriendController.searchUsers);

export default router;
