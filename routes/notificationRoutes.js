import express from 'express';
import {
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationHistory,
  sendTestNotification,
  getNotificationStats,
  triggerNotificationCheck,
  sendManualNotification,
  registerFCMToken,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// User notification routes
router.get('/preferences', protect, getNotificationPreferences);
router.put('/preferences', protect, updateNotificationPreferences);
router.get('/history', protect, getNotificationHistory);
router.post('/test', protect, sendTestNotification);
router.post('/register-token', protect, registerFCMToken);

// Admin notification routes (you might want to add admin middleware)
router.get('/stats', protect, getNotificationStats);
router.post('/trigger-check', protect, triggerNotificationCheck);
router.post('/send-manual', protect, sendManualNotification);

export default router;
