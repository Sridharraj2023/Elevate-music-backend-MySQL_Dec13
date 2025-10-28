import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';

// Middleware to check if user has active subscription
const requireSubscription = asyncHandler(async (req, res, next) => {
  const userId = req.user && req.user._id;
  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Check if user has active subscription
  if (!user.subscription || !user.subscription.id) {
    return res.status(403).json({
      message: 'Subscription required to access this content',
      subscriptionRequired: true,
    });
  }

  // Check subscription status
  const subscriptionStatus = user.subscription.status;
  const isValidStatus = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

  if (!isValidStatus) {
    // Check if user has made a recent payment (within 7 days) as fallback
    const paymentDate = user.subscription.paymentDate;
    let hasRecentPayment = false;

    if (paymentDate) {
      const now = new Date();
      const daysSincePayment = (now - paymentDate) / (1000 * 60 * 60 * 24);
      hasRecentPayment = daysSincePayment < 7;
    }

    if (!hasRecentPayment) {
      return res.status(403).json({
        message: 'Active subscription required to access this content',
        subscriptionRequired: true,
        currentStatus: subscriptionStatus,
      });
    }
  }

  next();
});

export { requireSubscription };
