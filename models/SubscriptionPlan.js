import mongoose from 'mongoose';

const subscriptionPlanSchema = new mongoose.Schema(
  {
    // Basic Plan Information
    title: {
      type: String,
      required: true,
      trim: true,
    },

    // Pricing Information
    monthlyCost: {
      type: Number,
      required: true,
      min: 0,
    },
    annualCost: {
      type: Number,
      required: true,
      min: 0,
    },

    // Plan Features
    adSupported: {
      type: String,
      required: true,
      enum: ['Yes', 'No'],
    },
    audioFileType: {
      type: String,
      required: true,
      trim: true,
    },
    offlineDownloads: {
      type: String,
      required: true,
      trim: true,
    },
    binauralTracks: {
      type: String,
      required: true,
      trim: true,
    },
    soundscapeTracks: {
      type: String,
      required: true,
      trim: true,
    },
    dynamicAudioFeatures: {
      type: String,
      required: true,
      enum: ['Yes', 'No'],
    },
    customTrackRequests: {
      type: String,
      required: true,
      enum: ['Yes', 'No'],
    },

    // Stripe Integration
    stripePriceId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    stripeMonthlyPriceId: {
      type: String,
      trim: true,
    },
    stripeYearlyPriceId: {
      type: String,
      trim: true,
    },
    stripeProductId: {
      type: String,
      trim: true,
    },

    // Plan Management
    isActive: {
      type: Boolean,
      default: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },

    // Version Control for Pricing Changes
    version: {
      type: Number,
      default: 1,
    },
    effectiveDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null, // null means currently active
    },

    // Metadata
    description: {
      type: String,
      trim: true,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],

    // Admin Tracking
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  },
);

// Indexes for better query performance
subscriptionPlanSchema.index({ isActive: 1, effectiveDate: 1 });
subscriptionPlanSchema.index({ stripePriceId: 1 });
subscriptionPlanSchema.index({ title: 1 });

// Virtual for formatted pricing display
subscriptionPlanSchema.virtual('monthlyCostFormatted').get(function () {
  return `$${this.monthlyCost.toFixed(2)}`;
});

subscriptionPlanSchema.virtual('annualCostFormatted').get(function () {
  return `$${this.annualCost.toFixed(2)}`;
});

// Method to get current active plan
subscriptionPlanSchema.statics.getCurrentActivePlan = function () {
  return this.findOne({
    isActive: true,
    $or: [{ endDate: null }, { endDate: { $gt: new Date() } }],
  }).sort({ effectiveDate: -1 });
};

// Method to get all active plans (for admin display)
subscriptionPlanSchema.statics.getActivePlans = function () {
  return this.find({
    isActive: true,
    $or: [{ endDate: null }, { endDate: { $gt: new Date() } }],
  }).sort({ effectiveDate: -1 });
};

// Method to deactivate plan (soft delete for history preservation)
subscriptionPlanSchema.methods.deactivate = function (adminUserId) {
  this.isActive = false;
  this.endDate = new Date();
  this.lastModifiedBy = adminUserId;
  return this.save();
};

// Ensure only one default plan exists
subscriptionPlanSchema.pre('save', async function (next) {
  if (this.isDefault && this.isNew) {
    // Remove default flag from other plans
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isDefault: false });
  }
  next();
});

const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);

export default SubscriptionPlan;
