import User from '../models/userModel.js';
import NotificationLog from '../models/NotificationLog.js';
import emailService from './emailService.js';
import cron from 'node-cron';
import { Op } from 'sequelize';

class NotificationScheduler {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('Notification scheduler is already running');
      return;
    }

    // Run every day at 9:00 AM UTC
    cron.schedule('0 9 * * *', async () => {
      console.log('Running daily notification check...');
      await this.checkExpiringSubscriptions();
    });

    // Run every hour for more frequent checks (optional)
    cron.schedule('0 * * * *', async () => {
      console.log('Running hourly notification check...');
      await this.checkExpiringSubscriptions();
    });

    this.isRunning = true;
    console.log('Notification scheduler started');
  }

  stop() {
    this.isRunning = false;
    console.log('Notification scheduler stopped');
  }

  async checkExpiringSubscriptions() {
    try {
      const today = new Date();
      const sevenDaysFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      const threeDaysFromNow = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
      const oneDayFromNow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const expiredDate = new Date(today.getTime() - 24 * 60 * 60 * 1000); // Yesterday

      // Find users with subscriptions and email reminders enabled
      const users = await User.findAll({
        where: {
          subscription: { [Op.ne]: null },
        },
      });

      console.log(`Found ${users.length} users with subscriptions`);

      // Filter users who have email reminders enabled and active subscriptions
      const eligibleUsers = users.filter(user => {
        if (!user.subscription || !user.notificationPreferences) return false;
        
        const hasEmailReminders = user.notificationPreferences.emailReminders === true;
        const hasPaymentDate = user.subscription.paymentDate !== null;
        
        return hasEmailReminders && hasPaymentDate;
      });

      console.log(`Found ${eligibleUsers.length} eligible users for notifications`);

      for (const user of eligibleUsers) {
        await this.processUserReminder(
          user,
          today,
          sevenDaysFromNow,
          threeDaysFromNow,
          oneDayFromNow,
          expiredDate,
        );
      }

      console.log('Notification check completed');
    } catch (error) {
      console.error('Error in notification scheduler:', error);
    }
  }

  async processUserReminder(
    user,
    today,
    sevenDaysFromNow,
    threeDaysFromNow,
    oneDayFromNow,
    expiredDate,
  ) {
    try {
      if (!user.subscription || !user.subscription.paymentDate) {
        return; // No subscription or payment date
      }

      const paymentDate = new Date(user.subscription.paymentDate);
      const validityDays = user.subscription.validityDays || 30;
      const expiryDate = new Date(
        paymentDate.getTime() + validityDays * 24 * 60 * 60 * 1000,
      );
      const remainingDays = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      // Check if user should receive a reminder
      const reminderType = this.getReminderType(
        expiryDate,
        today,
        sevenDaysFromNow,
        threeDaysFromNow,
        oneDayFromNow,
        expiredDate,
      );

      if (!reminderType) {
        return; // No reminder needed
      }

      // Check if user has already received this type of reminder recently
      const lastReminder = await NotificationLog.findOne({
        where: {
          userId: user.id,
          template: reminderType,
          status: 'sent',
          sentAt: { [Op.gte]: new Date(today.getTime() - 24 * 60 * 60 * 1000) },
        },
      });

      if (lastReminder) {
        console.log(`User ${user.email} already received ${reminderType} reminder recently`);
        return;
      }

      // Check if user has this reminder type enabled
      const reminderFrequency = user.notificationPreferences?.reminderFrequency || [];
      const reminderTypeKey = reminderType.replace('_reminder', 'days');
      if (!reminderFrequency.includes(reminderTypeKey)) {
        console.log(`User ${user.email} has ${reminderType} reminders disabled`);
        return;
      }

      // Send reminder
      await this.sendReminder(user, reminderType, remainingDays);
    } catch (error) {
      console.error(`Error processing reminder for user ${user.email}:`, error);
    }
  }

  getReminderType(
    expiryDate,
    today,
    sevenDaysFromNow,
    threeDaysFromNow,
    oneDayFromNow,
    expiredDate,
  ) {
    const expiryTime = expiryDate.getTime();
    const todayTime = today.getTime();
    const sevenDaysTime = sevenDaysFromNow.getTime();
    const threeDaysTime = threeDaysFromNow.getTime();
    const oneDayTime = oneDayFromNow.getTime();
    const expiredTime = expiredDate.getTime();

    // Check if expiry is within 7 days (with 1 day tolerance)
    if (
      expiryTime >= sevenDaysTime - 24 * 60 * 60 * 1000 &&
      expiryTime <= sevenDaysTime + 24 * 60 * 60 * 1000
    ) {
      return '7day_reminder';
    }

    // Check if expiry is within 3 days (with 1 day tolerance)
    if (
      expiryTime >= threeDaysTime - 24 * 60 * 60 * 1000 &&
      expiryTime <= threeDaysTime + 24 * 60 * 60 * 1000
    ) {
      return '3day_reminder';
    }

    // Check if expiry is within 1 day (with 1 day tolerance)
    if (
      expiryTime >= oneDayTime - 24 * 60 * 60 * 1000 &&
      expiryTime <= oneDayTime + 24 * 60 * 60 * 1000
    ) {
      return '1day_reminder';
    }

    // Check if subscription has expired
    if (expiryTime <= expiredTime) {
      return 'expired_reminder';
    }

    return null;
  }

  async sendReminder(user, reminderType, remainingDays) {
    try {
      console.log(`Sending ${reminderType} reminder to ${user.email}`);

      // Send email reminder
      const emailResult = await emailService.sendReminderEmail(user, reminderType, remainingDays);

      // Log the notification
      await NotificationLog.create({
        userId: user.id,
        type: 'email',
        template: reminderType,
        status: emailResult.success ? 'sent' : 'failed',
        metadata: {
          emailAddress: user.email,
          errorMessage: emailResult.error || null,
          deliveryId: emailResult.messageId || null,
        },
      });

      // Update user's last reminder sent date in notification preferences
      const updatedPreferences = {
        ...user.notificationPreferences,
        lastReminderSent: new Date().toISOString(),
      };
      await User.update(
        { notificationPreferences: updatedPreferences },
        { where: { id: user.id } }
      );

      console.log(
        `${reminderType} reminder ${emailResult.success ? 'sent' : 'failed'} to ${user.email}`,
      );
    } catch (error) {
      console.error(`Error sending reminder to ${user.email}:`, error);

      // Log failed notification
      await NotificationLog.create({
        userId: user.id,
        type: 'email',
        template: reminderType,
        status: 'failed',
        metadata: {
          emailAddress: user.email,
          errorMessage: error.message,
        },
      });
    }
  }

  // Manual trigger for testing
  async triggerManualCheck() {
    console.log('Manual notification check triggered');
    await this.checkExpiringSubscriptions();
  }

  // Get notification statistics
  async getNotificationStats() {
    try {
      const stats = {
        totalSent: await NotificationLog.count({ where: { status: 'sent' } }),
        totalFailed: await NotificationLog.count({ where: { status: 'failed' } }),
        totalPending: await NotificationLog.count({ where: { status: 'pending' } }),
        recentActivity: await NotificationLog.findAll({
          where: {
            sentAt: { [Op.gte]: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
          order: [['sentAt', 'DESC']],
          limit: 10,
        }),
      };

      return stats;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

export default new NotificationScheduler();
