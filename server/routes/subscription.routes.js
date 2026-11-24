import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

export const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Starter',
    priceMonthly: 0,
    priceYearly: 0,
    listingLimit: 2,
    sponsoredSlots: 0,
    badge: 'Standard Seller',
    features: [
      'Up to 2 active property listings',
      'Standard search visibility',
      'Basic seller dashboard',
      'Customer enquiries inbox',
      'Standard visit scheduling',
      'Community support',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro Landlord',
    priceMonthly: 999,
    priceYearly: 9999,
    listingLimit: 10,
    sponsoredSlots: 2,
    badge: 'Verified Landlord',
    features: [
      'Up to 10 active property listings',
      '3x Search visibility boost',
      '2 Sponsored property slots included',
      'Verified Landlord badge',
      'Priority tenant enquiries',
      'Advanced listing analytics (views & clicks)',
      'Direct WhatsApp lead notifications',
      'Standard priority support',
    ],
  },
  premium: {
    id: 'premium',
    name: 'Premium Enterprise',
    priceMonthly: 2499,
    priceYearly: 24999,
    listingLimit: 999,
    sponsoredSlots: 6,
    badge: 'Premium Partner',
    features: [
      'Unlimited active property listings',
      'Top placement in search results',
      '6 Sponsored property slots included',
      'Exclusive Gold Partner badge',
      'Instant VIP tenant alerts & leads',
      'Complete demographic & market analytics',
      'Dedicated account manager',
      'Zero platform commission forever',
    ],
  },
};

// @route   GET /api/subscriptions/plans
// @desc    Get all available subscription plans
// @access  Public
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    data: SUBSCRIPTION_PLANS,
  });
});

// @route   GET /api/subscriptions/my-subscription
// @desc    Get current seller subscription status
// @access  Private (Seller/Admin)
router.get('/my-subscription', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const planKey = user.subscription?.plan || 'free';
    const planDetails = SUBSCRIPTION_PLANS[planKey] || SUBSCRIPTION_PLANS.free;

    res.json({
      success: true,
      subscription: {
        ...user.subscription.toObject(),
        planDetails,
        daysRemaining: Math.max(
          0,
          Math.ceil((new Date(user.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24))
        ),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch subscription' });
  }
});

export default router;
