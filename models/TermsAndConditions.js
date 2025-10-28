import mongoose from 'mongoose';

const termsAndConditionsSchema = mongoose.Schema(
  {
    documentType: {
      type: String,
      required: true,
      enum: ['terms', 'disclaimer'],
      default: 'terms',
    },
    title: {
      type: String,
      required: true,
      default: 'Terms and Conditions',
    },
    content: {
      type: String,
      required: true,
    },
    version: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Ensure only one active version at a time
termsAndConditionsSchema.index({ isActive: 1 });

const TermsAndConditions = mongoose.model('TermsAndConditions', termsAndConditionsSchema);

export default TermsAndConditions;
