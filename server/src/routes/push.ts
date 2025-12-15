// server/src/routes/push.ts

import express from 'express';
import { PushController } from '../controllers/PushController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', authenticate, PushController.subscribe);

// Unsubscribe from push notifications
router.post('/unsubscribe', authenticate, PushController.unsubscribe);

export default router;
