import mongoose from 'mongoose';

const notificationLogSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['email', 'push', 'in-app'],
      required: true,
    },
    template: {
      type: String,
      enum: ['7day_reminder', '3day_reminder', '1day_reminder', 'expired_reminder', 'grace_period'],
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'pending'],
      default: 'pending',
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      emailAddress: String,
      pushToken: String,
      errorMessage: String,
      deliveryId: String,
    },
  },
  {
    timestamps: true,
  },
);

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

export default NotificationLog;
