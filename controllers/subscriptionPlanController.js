import SubscriptionPlan from '../models/SubscriptionPlan.js';
import User from '../models/userModel.js';
import Stripe from 'stripe';
import { Op } from 'sequelize';

// Initialize Stripe
let stripe = null;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
} else {
  console.warn(
    'SubscriptionPlan Controller - STRIPE_SECRET_KEY not found - Stripe will not be initialized',
  );
}

// GET /admin/subscription-plans - Get all subscription plans (admin only)
export const getAllSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.findAll({
      include: [
        { model: User, as: 'createdBy', attributes: ['name', 'email'] },
        { model: User, as: 'lastModifiedBy', attributes: ['name', 'email'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans',
      error: error.message,
    });
  }
};

// GET /admin/subscription-plans/active - Get active subscription plans
export const getActiveSubscriptionPlans = async (req, res) => {
  try {
    const plans = await SubscriptionPlan.getActivePlans();

    return res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching active subscription plans:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch active subscription plans',
      error: error.message,
    });
  }
};

// GET /admin/subscription-plans/:id - Get single subscription plan
export const getSubscriptionPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await SubscriptionPlan.findByPk(id, {
      include: [
        { model: User, as: 'createdBy', attributes: ['name', 'email'] },
        { model: User, as: 'lastModifiedBy', attributes: ['name', 'email'] }
      ]
    });

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found',
      });
    }

    return res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plan',
      error: error.message,
    });
  }
};

// POST /admin/subscription-plans - Create new subscription plan
export const createSubscriptionPlan = async (req, res) => {
  try {
    const {
      title,
      monthlyCost,
      annualCost,
      adSupported,
      audioFileType,
      offlineDownloads,
      binauralTracks,
      soundscapeTracks,
      dynamicAudioFeatures,
      customTrackRequests,
      description,
      features,
      isDefault,
      stripeMonthlyPriceId,
      stripeYearlyPriceId,
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'title',
      'monthlyCost',
      'annualCost',
      'adSupported',
      'audioFileType',
      'offlineDownloads',
      'binauralTracks',
      'soundscapeTracks',
      'dynamicAudioFeatures',
      'customTrackRequests',
    ];

    for (const field of requiredFields) {
      if (!req.body[field] && req.body[field] !== 0) {
        return res.status(400).json({
          success: false,
          message: `${field} is required`,
        });
      }
    }

    // Create Stripe product and prices if Stripe is available
    let stripePriceId = stripeMonthlyPriceId || '';
    let stripeMonthlyPriceIdFinal = stripeMonthlyPriceId || '';
    let stripeYearlyPriceIdFinal = stripeYearlyPriceId || '';
    let stripeProductId = '';

    // If price IDs are manually provided, use them; otherwise create new ones
    if (stripe && (!stripeMonthlyPriceIdFinal || !stripeYearlyPriceIdFinal)) {
      try {
        // Create Stripe product
        const product = await stripe.products.create({
          name: title,
          description: description || `Subscription plan: ${title}`,
          metadata: {
            plan_type: 'subscription',
            created_by_admin: req.user.id.toString(),
          },
        });

        stripeProductId = product.id;

        // Create Stripe price for monthly subscription if not provided
        if (!stripeMonthlyPriceIdFinal) {
          const monthlyPrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: Math.round(monthlyCost * 100), // Convert to cents
            currency: 'usd',
            recurring: {
              interval: 'month',
            },
            metadata: {
              plan_title: title,
              billing_period: 'monthly',
            },
          });

          stripeMonthlyPriceIdFinal = monthlyPrice.id;
          stripePriceId = monthlyPrice.id; // Keep for backward compatibility
        }

        // Create Stripe price for yearly subscription if not provided
        if (!stripeYearlyPriceIdFinal) {
          const yearlyPrice = await stripe.prices.create({
            product: stripeProductId,
            unit_amount: Math.round(annualCost * 100), // Convert to cents
            currency: 'usd',
            recurring: {
              interval: 'year',
            },
            metadata: {
              plan_title: title,
              billing_period: 'yearly',
            },
          });

          stripeYearlyPriceIdFinal = yearlyPrice.id;
        }

        console.log('Created/Using Stripe product and prices:', {
          productId: stripeProductId,
          monthlyPriceId: stripeMonthlyPriceIdFinal,
          yearlyPriceId: stripeYearlyPriceIdFinal,
        });
      } catch (stripeError) {
        console.error('Stripe error creating product/price:', stripeError);
        return res.status(500).json({
          success: false,
          message: 'Failed to create Stripe product/price',
          error: stripeError.message,
        });
      }
    } else {
      // Use manually provided price IDs or environment variable as fallback
      stripePriceId = stripeMonthlyPriceIdFinal || process.env.STRIPE_PRICE_ID || '';
      stripeMonthlyPriceIdFinal = stripeMonthlyPriceIdFinal || process.env.STRIPE_PRICE_ID || '';
      stripeYearlyPriceIdFinal = stripeYearlyPriceIdFinal || '';
    }

    // Create subscription plan
    const newPlan = await SubscriptionPlan.create({
      title,
      monthlyCost: parseFloat(monthlyCost),
      annualCost: parseFloat(annualCost),
      adSupported,
      audioFileType,
      offlineDownloads,
      binauralTracks,
      soundscapeTracks,
      dynamicAudioFeatures,
      customTrackRequests,
      stripePriceId: stripePriceId || stripeMonthlyPriceIdFinal,
      stripeMonthlyPriceId: stripeMonthlyPriceIdFinal,
      stripeYearlyPriceId: stripeYearlyPriceIdFinal,
      stripeProductId,
      description,
      features: features || [],
      isDefault: isDefault || false,
      createdById: req.user?.id || req.user?.userId || null,
      effectiveDate: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: newPlan,
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create subscription plan',
      error: error.message,
    });
  }
};

// PUT /admin/subscription-plans/:id - Update subscription plan
export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body, lastModifiedById: req.user.id };

    // Remove fields that shouldn't be updated directly (except new price IDs)
    delete updateData.stripePriceId;
    delete updateData.stripeProductId;
    delete updateData.createdBy;

    // Allow updating price IDs if manually provided
    if (updateData.stripeMonthlyPriceId === undefined) {
      delete updateData.stripeMonthlyPriceId;
    }
    if (updateData.stripeYearlyPriceId === undefined) {
      delete updateData.stripeYearlyPriceId;
    }

    // Convert string numbers to actual numbers
    if (updateData.monthlyCost) {
      updateData.monthlyCost = parseFloat(updateData.monthlyCost);
    }
    if (updateData.annualCost) {
      updateData.annualCost = parseFloat(updateData.annualCost);
    }

    await SubscriptionPlan.update(updateData, { where: { id } });
    
    const updatedPlan = await SubscriptionPlan.findByPk(id, {
      include: [
        { model: User, as: 'createdBy', attributes: ['name', 'email'] },
        { model: User, as: 'lastModifiedBy', attributes: ['name', 'email'] }
      ]
    });

    if (!updatedPlan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found',
      });
    }

    return res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: updatedPlan,
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update subscription plan',
      error: error.message,
    });
  }
};

// DELETE /admin/subscription-plans/:id - Deactivate subscription plan (soft delete)
export const deactivateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found',
      });
    }

    // Deactivate the plan
    plan.isActive = false;
    plan.lastModifiedById = req.user.id;
    await plan.save();

    return res.json({
      success: true,
      message: 'Subscription plan deactivated successfully',
    });
  } catch (error) {
    console.error('Error deactivating subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate subscription plan',
      error: error.message,
    });
  }
};

// PUT /admin/subscription-plans/:id/activate - Reactivate subscription plan
export const activateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found',
      });
    }

    plan.isActive = true;
    plan.endDate = null;
    plan.lastModifiedById = req.user.id;
    await plan.save();

    return res.json({
      success: true,
      message: 'Subscription plan activated successfully',
      data: plan,
    });
  } catch (error) {
    console.error('Error activating subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to activate subscription plan',
      error: error.message,
    });
  }
};

// GET /subscription-plans/current - Get current active pricing for new customers (public endpoint)
export const getCurrentSubscriptionPlan = async (req, res) => {
  try {
    const currentPlan = await SubscriptionPlan.getCurrentActivePlan();

    if (!currentPlan) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription plan found',
      });
    }

    // Return only the data needed for the frontend
    const planData = {
      id: currentPlan.id,
      title: currentPlan.title,
      monthlyCost: currentPlan.monthlyCostFormatted,
      annualCost: currentPlan.annualCostFormatted,
      adSupported: currentPlan.adSupported,
      audioFileType: currentPlan.audioFileType,
      offlineDownloads: currentPlan.offlineDownloads,
      binauralTracks: currentPlan.binauralTracks,
      soundscapeTracks: currentPlan.soundscapeTracks,
      dynamicAudioFeatures: currentPlan.dynamicAudioFeatures,
      customTrackRequests: currentPlan.customTrackRequests,
      priceId: currentPlan.stripePriceId, // Keep for backward compatibility
      monthlyPriceId: currentPlan.stripeMonthlyPriceId || currentPlan.stripePriceId || '',
      yearlyPriceId: currentPlan.stripeYearlyPriceId || currentPlan.stripePriceId || '',
      description: currentPlan.description,
      features: currentPlan.features,
    };

    return res.json({
      success: true,
      data: planData,
    });
  } catch (error) {
    console.error('Error fetching current subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current subscription plan',
      error: error.message,
    });
  }
};

// POST /admin/subscription-plans/:id/set-default - Set plan as default
export const setDefaultSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await SubscriptionPlan.findByPk(id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found',
      });
    }

    // Remove default flag from all other plans
    await SubscriptionPlan.update(
      { isDefault: false, lastModifiedById: req.user.id },
      { where: { id: { [Op.ne]: id } } }
    );

    // Set this plan as default
    plan.isDefault = true;
    plan.lastModifiedById = req.user.id;
    await plan.save();

    return res.json({
      success: true,
      message: 'Default subscription plan updated successfully',
      data: plan,
    });
  } catch (error) {
    console.error('Error setting default subscription plan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to set default subscription plan',
      error: error.message,
    });
  }
};