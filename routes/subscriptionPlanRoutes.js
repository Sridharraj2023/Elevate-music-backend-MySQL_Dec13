import express from 'express';
import {
  getAllSubscriptionPlans,
  getActiveSubscriptionPlans,
  getSubscriptionPlanById,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deactivateSubscriptionPlan,
  activateSubscriptionPlan,
  getCurrentSubscriptionPlan,
  setDefaultSubscriptionPlan,
} from '../controllers/subscriptionPlanController.js';
import { protect } from '../middleware/authMiddleware.js';
import { adminOnly } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Public routes (no authentication required)
// GET /subscription-plans/current - Get current active pricing for new customers
router.get('/current', getCurrentSubscriptionPlan);

// Admin routes (require authentication and admin role)
// GET /admin/subscription-plans - Get all subscription plans
router.get('/admin/subscription-plans', protect, adminOnly, getAllSubscriptionPlans);

// GET /admin/subscription-plans/active - Get active subscription plans
router.get('/admin/subscription-plans/active', protect, adminOnly, getActiveSubscriptionPlans);

// GET /admin/subscription-plans/:id - Get single subscription plan
router.get('/admin/subscription-plans/:id', protect, adminOnly, getSubscriptionPlanById);

// POST /admin/subscription-plans - Create new subscription plan
router.post('/admin/subscription-plans', protect, adminOnly, createSubscriptionPlan);

// PUT /admin/subscription-plans/:id - Update subscription plan
router.put('/admin/subscription-plans/:id', protect, adminOnly, updateSubscriptionPlan);

// DELETE /admin/subscription-plans/:id - Deactivate subscription plan (soft delete)
router.delete('/admin/subscription-plans/:id', protect, adminOnly, deactivateSubscriptionPlan);

// PUT /admin/subscription-plans/:id/activate - Reactivate subscription plan
router.put('/admin/subscription-plans/:id/activate', protect, adminOnly, activateSubscriptionPlan);

// PUT /admin/subscription-plans/:id/set-default - Set plan as default
router.put(
  '/admin/subscription-plans/:id/set-default',
  protect,
  adminOnly,
  setDefaultSubscriptionPlan,
);

export default router;
