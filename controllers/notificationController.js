import User from '../models/userModel.js';
import NotificationLog from '../models/NotificationLog.js';
import notificationScheduler from '../services/notificationScheduler.js';
import emailService from '../services/emailService.js';

// GET /notifications/preferences - Get user notification preferences
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      preferences: user.notificationPreferences,
      lastReminderSent: user.notificationPreferences.lastReminderSent,
    });
  } catch (error) {
    console.error('Error fetching notification preferences:', error);
    return res.status(500).json({
      message: 'Failed to fetch notification preferences',
      error: error.message,
    });
  }
};

// PUT /notifications/preferences - Update user notification preferences
export const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { emailReminders, pushNotifications, reminderFrequency, preferredTime, timezone } =
      req.body;

    const updateData = {};
    if (emailReminders !== undefined)
      updateData['notificationPreferences.emailReminders'] = emailReminders;
    if (pushNotifications !== undefined)
      updateData['notificationPreferences.pushNotifications'] = pushNotifications;
    if (reminderFrequency !== undefined)
      updateData['notificationPreferences.reminderFrequency'] = reminderFrequency;
    if (preferredTime !== undefined)
      updateData['notificationPreferences.preferredTime'] = preferredTime;
    if (timezone !== undefined) updateData['notificationPreferences.timezone'] = timezone;

    const user = await User.findByIdAndUpdate(userId, { $set: updateData }, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'Notification preferences updated successfully',
      preferences: user.notificationPreferences,
    });
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return res.status(500).json({
      message: 'Failed to update notification preferences',
      error: error.message,
    });
  }
};

// GET /notifications/history - Get user notification history
export const getNotificationHistory = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const notifications = await NotificationLog.find({ userId })
      .sort({ sentAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await NotificationLog.countDocuments({ userId });

    return res.json({
      notifications,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: notifications.length,
        totalCount: total,
      },
    });
  } catch (error) {
    console.error('Error fetching notification history:', error);
    return res.status(500).json({
      message: 'Failed to fetch notification history',
      error: error.message,
    });
  }
};

// POST /notifications/test - Send test notification (for admin)
export const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { reminderType = '7day_reminder' } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate remaining days for test
    const remainingDays = 7; // Default for testing

    const result = await emailService.sendReminderEmail(user, reminderType, remainingDays);

    // Log the test notification
    await NotificationLog.create({
      userId: user._id,
      type: 'email',
      template: reminderType,
      status: result.success ? 'sent' : 'failed',
      metadata: {
        emailAddress: user.email,
        errorMessage: result.error || null,
        deliveryId: result.messageId || null,
        isTest: true,
      },
    });

    return res.json({
      message: result.success ? 'Test notification sent successfully' : 'Test notification failed',
      success: result.success,
      error: result.error,
    });
  } catch (error) {
    console.error('Error sending test notification:', error);
    return res.status(500).json({
      message: 'Failed to send test notification',
      error: error.message,
    });
  }
};

// GET /notifications/stats - Get notification statistics (for admin)
export const getNotificationStats = async (req, res) => {
  try {
    const stats = await notificationScheduler.getNotificationStats();
    return res.json(stats);
  } catch (error) {
    console.error('Error fetching notification stats:', error);
    return res.status(500).json({
      message: 'Failed to fetch notification stats',
      error: error.message,
    });
  }
};

// POST /notifications/trigger-check - Manually trigger notification check (for admin)
export const triggerNotificationCheck = async (req, res) => {
  try {
    await notificationScheduler.triggerManualCheck();
    return res.json({ message: 'Notification check triggered successfully' });
  } catch (error) {
    console.error('Error triggering notification check:', error);
    return res.status(500).json({
      message: 'Failed to trigger notification check',
      error: error.message,
    });
  }
};

// POST /notifications/register-token - Register FCM token for push notifications
export const registerFCMToken = async (req, res) => {
  try {
    const userId = req.user && req.user._id;
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ message: 'FCM token is required' });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { 'notificationPreferences.fcmToken': fcmToken },
      { new: true },
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({
      message: 'FCM token registered successfully',
      fcmToken: fcmToken,
    });
  } catch (error) {
    console.error('Error registering FCM token:', error);
    return res.status(500).json({
      message: 'Failed to register FCM token',
      error: error.message,
    });
  }
};

// POST /notifications/send-manual - Send manual notification to specific users (for admin)
export const sendManualNotification = async (req, res) => {
  try {
    const { userIds, template, customMessage } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs array is required' });
    }

    if (!template) {
      return res.status(400).json({ message: 'Template is required' });
    }

    const results = [];

    for (const userId of userIds) {
      try {
        const user = await User.findById(userId);
        if (!user) {
          results.push({ userId, success: false, error: 'User not found' });
          continue;
        }

        const remainingDays = 7; // Default for manual notifications
        const result = await emailService.sendReminderEmail(user, template, remainingDays);

        // Log the manual notification
        await NotificationLog.create({
          userId: user._id,
          type: 'email',
          template: template,
          status: result.success ? 'sent' : 'failed',
          metadata: {
            emailAddress: user.email,
            errorMessage: result.error || null,
            deliveryId: result.messageId || null,
            isManual: true,
            customMessage: customMessage || null,
          },
        });

        results.push({
          userId,
          email: user.email,
          success: result.success,
          error: result.error,
        });
      } catch (error) {
        results.push({ userId, success: false, error: error.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return res.json({
      message: `Manual notifications sent: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount,
      },
    });
  } catch (error) {
    console.error('Error sending manual notifications:', error);
    return res.status(500).json({
      message: 'Failed to send manual notifications',
      error: error.message,
    });
  }
};
