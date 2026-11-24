import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Enquiry from '../models/Enquiry.js';
import Property from '../models/Property.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// @route   POST /api/enquiries
// @desc    Customer submits a rental enquiry to seller
// @access  Private (Customer/Any logged in user)
router.post('/', protect, async (req, res) => {
  try {
    const { propertyId, fullName, email, phone, moveInDate, tenantType, occupantsCount, message } = req.body;

    if (!propertyId || !message || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Property ID, contact phone, and message are required',
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    // Check if seller is inquiring on own property
    if (property.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot send an enquiry on your own property',
      });
    }

    const enquiry = await Enquiry.create({
      property: propertyId,
      customer: req.user._id,
      seller: property.seller,
      fullName: fullName ? fullName.trim() : req.user.name,
      email: email ? email.trim() : req.user.email,
      phone: phone.trim(),
      moveInDate: moveInDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      tenantType: tenantType || 'Family',
      occupantsCount: occupantsCount ? Number(occupantsCount) : 1,
      message: message.trim(),
      status: 'pending',
    });

    // Increment property enquiry count
    property.enquiriesCount = (property.enquiriesCount || 0) + 1;
    await property.save();

    // Create notification for seller
    await Notification.create({
      recipient: property.seller,
      title: 'New Rental Enquiry Received',
      message: `${req.user.name} sent an enquiry for "${property.title}"`,
      type: 'enquiry',
      link: `/seller/dashboard#enquiries`,
    });

    res.status(201).json({
      success: true,
      message: 'Rental enquiry sent successfully to the landlord!',
      data: enquiry,
    });
  } catch (error) {
    console.error('Enquiry error:', error);
    res.status(500).json({ success: false, message: 'Failed to send enquiry' });
  }
});

// @route   GET /api/enquiries/customer
// @desc    Get all enquiries submitted by current customer
// @access  Private
router.get('/customer', protect, async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ customer: req.user._id })
      .populate('property', 'title rent bhk propertyType images location status')
      .populate('seller', 'name phone email isVerified')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch your enquiries' });
  }
});

// @route   GET /api/enquiries/seller
// @desc    Get all incoming enquiries for current seller
// @access  Private (Seller/Admin)
router.get('/seller', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const enquiries = await Enquiry.find({ seller: req.user._id })
      .populate('property', 'title rent bhk propertyType images location')
      .populate('customer', 'name email phone avatar')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch seller enquiries' });
  }
});

// @route   PATCH /api/enquiries/:id/status
// @desc    Update enquiry status & response notes
// @access  Private (Seller/Admin)
router.patch('/:id/status', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const { status, sellerResponse } = req.body;

    const enquiry = await Enquiry.findById(req.params.id);
    if (!enquiry) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    if (enquiry.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (status) enquiry.status = status;
    if (sellerResponse !== undefined) enquiry.sellerResponse = sellerResponse.trim();
    await enquiry.save();

    // Notify customer of status change
    await Notification.create({
      recipient: enquiry.customer,
      title: `Enquiry Update: ${status.toUpperCase()}`,
      message: `The landlord updated your enquiry status to "${status}".`,
      type: 'enquiry',
      link: '/customer/dashboard#enquiries',
    });

    res.json({
      success: true,
      message: 'Enquiry updated successfully',
      data: enquiry,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update enquiry' });
  }
});

export default router;
