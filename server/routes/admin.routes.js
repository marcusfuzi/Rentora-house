import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import User from '../models/User.js';
import Property from '../models/Property.js';
import Payment from '../models/Payment.js';
import Enquiry from '../models/Enquiry.js';
import Report from '../models/Report.js';

const router = express.Router();

// Apply admin guard to all routes in this router
router.use(protect, authorize('admin'));

// @route   GET /api/admin/metrics
// @desc    Platform-wide high level metrics & analytics
// @access  Admin
router.get('/metrics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'customer' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const verifiedSellers = await User.countDocuments({ role: 'seller', isVerified: true });

    const totalProperties = await Property.countDocuments();
    const activeProperties = await Property.countDocuments({ status: 'active' });
    const rentedProperties = await Property.countDocuments({ status: 'rented' });
    const sponsoredProperties = await Property.countDocuments({ isSponsored: true });

    const totalEnquiries = await Enquiry.countDocuments();
    const pendingReports = await Report.countDocuments({ status: 'pending' });

    // Financial calculations
    const capturedPayments = await Payment.find({ status: 'captured' });
    const totalRevenue = capturedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const activeSubscriptions = await User.countDocuments({
      'subscription.plan': { $in: ['pro', 'premium'] },
      'subscription.status': 'active',
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          customers: totalCustomers,
          sellers: totalSellers,
          verifiedSellers,
        },
        properties: {
          total: totalProperties,
          active: activeProperties,
          rented: rentedProperties,
          sponsored: sponsoredProperties,
        },
        business: {
          totalRevenue,
          activeSubscriptions,
          totalEnquiries,
          pendingReports,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch admin metrics' });
  }
});

// @route   GET /api/admin/users
// @desc    Get all users (with role filtering)
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { role } = req.query;
    const filter = role ? { role } : {};
    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// @route   PATCH /api/admin/users/:id/verify
// @desc    Toggle verified landlord status for seller
// @access  Admin
router.patch('/users/:id/verify', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isVerified = !user.isVerified;
    await user.save();

    res.json({
      success: true,
      message: `User is now ${user.isVerified ? 'VERIFIED' : 'UNVERIFIED'}`,
      isVerified: user.isVerified,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update verification' });
  }
});

// @route   GET /api/admin/properties
// @desc    Get all platform properties with filter
// @access  Admin
router.get('/properties', async (req, res) => {
  try {
    const { status, isSponsored } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (isSponsored !== undefined) filter.isSponsored = isSponsored === 'true';

    const properties = await Property.find(filter)
      .populate('seller', 'name email phone isVerified subscription')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: properties.length, data: properties });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch properties' });
  }
});

// @route   PATCH /api/admin/properties/:id/moderate
// @desc    Moderate property: approve, reject, suspend, activate, sponsor
// @access  Admin
router.patch('/properties/:id/moderate', async (req, res) => {
  try {
    const { status, isSponsored } = req.body;
    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    if (status) property.status = status;
    if (isSponsored !== undefined) {
      property.isSponsored = isSponsored;
      if (isSponsored && !property.sponsoredExpiresAt) {
        property.sponsoredExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      }
    }

    await property.save();

    res.json({
      success: true,
      message: `Property status updated to ${property.status}`,
      data: property,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to moderate property' });
  }
});

// @route   GET /api/admin/payments
// @desc    View all subscription transactions and revenue logs
// @access  Admin
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('user', 'name email role')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: payments.length, data: payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment records' });
  }
});

// @route   GET /api/admin/reports
// @desc    View reported listings
// @access  Admin
router.get('/reports', async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('property', 'title location rent images status')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reports.length, data: reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// @route   PATCH /api/admin/reports/:id
// @desc    Resolve or dismiss report
// @access  Admin
router.patch('/reports/:id', async (req, res) => {
  try {
    const { status, adminAction } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    if (status) report.status = status;
    if (adminAction) report.adminAction = adminAction;
    await report.save();

    res.json({ success: true, message: 'Report updated', data: report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update report' });
  }
});

export default router;
