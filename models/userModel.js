import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true, // Ensures email uniqueness check is case-insensitive
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'], // Define allowed roles
      default: 'user', // Default role is 'user'
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    autoDebit: {
      type: Boolean,
      default: false,
    },
    subscription: {
      id: {
        type: String,
        default: null,
      },
      status: {
        type: String,
        default: null,
      },
      currentPeriodEnd: {
        type: Date,
        default: null,
      },
      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },
      paymentDate: {
        type: Date,
        default: null,
      },
      validityDays: {
        type: Number,
        default: 30,
      },
      interval: {
        type: String,
        enum: ['month', 'year'],
        default: 'month',
      },
    },
    notificationPreferences: {
      emailReminders: {
        type: Boolean,
        default: true,
      },
      pushNotifications: {
        type: Boolean,
        default: true,
      },
      reminderFrequency: [
        {
          type: String,
          enum: ['7days', '3days', '1day', 'expired'],
          default: ['7days', '3days', '1day'],
        },
      ],
      preferredTime: {
        type: String,
        default: '09:00',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      lastReminderSent: {
        type: Date,
        default: null,
      },
      fcmToken: {
        type: String,
        default: null,
      },
    },
    // Password Reset Fields
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

// Match user-entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash token and save to database
  this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set token expiration (1 hour)
  this.resetPasswordExpires = Date.now() + 60 * 60 * 1000;

  return resetToken;
};

// Method to clear password reset fields
userSchema.methods.clearPasswordResetToken = function () {
  this.resetPasswordToken = null;
  this.resetPasswordExpires = null;
};

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next(); // Prevent unnecessary hashing
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model('User', userSchema);

export default User;
