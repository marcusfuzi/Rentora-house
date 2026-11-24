import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import Visit from '../models/Visit.js';
import Property from '../models/Property.js';
import Notification from '../models/Notification.js';

const router = express.Router();

// @route   POST /api/visits
// @desc    Schedule a property visit (In-Person or Video)
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { propertyId, visitType, preferredDate, timeSlot, customerNotes } = req.body;

    if (!propertyId || !preferredDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Property, date, and preferred time slot are required',
      });
    }

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    if (property.seller.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot schedule a visit for your own property',
      });
    }

    const visit = await Visit.create({
      property: propertyId,
      customer: req.user._id,
      seller: property.seller,
      visitType: visitType || 'In-Person',
      preferredDate: new Date(preferredDate),
      timeSlot,
      customerNotes: customerNotes ? customerNotes.trim() : '',
      status: 'requested',
    });

    // Notify seller
    await Notification.create({
      recipient: property.seller,
      title: 'New Visit Request',
      message: `${req.user.name} requested an ${visitType || 'In-Person'} visit on ${new Date(
        preferredDate
      ).toLocaleDateString()}`,
      type: 'visit',
      link: '/seller/dashboard#visits',
    });

    res.status(201).json({
      success: true,
      message: 'Property visit request submitted to the landlord!',
      data: visit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to schedule visit' });
  }
});

// @route   GET /api/visits/customer
// @desc    Get customer's scheduled visits
// @access  Private
router.get('/customer', protect, async (req, res) => {
  try {
    const visits = await Visit.find({ customer: req.user._id })
      .populate('property', 'title rent bhk propertyType images location')
      .populate('seller', 'name phone email')
      .sort({ preferredDate: 1 });

    res.json({
      success: true,
      count: visits.length,
      data: visits,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch visits' });
  }
});

// @route   GET /api/visits/seller
// @desc    Get seller's visit appointments
// @access  Private (Seller/Admin)
router.get('/seller', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const visits = await Visit.find({ seller: req.user._id })
      .populate('property', 'title rent bhk propertyType images location')
      .populate('customer', 'name phone email avatar')
      .sort({ preferredDate: 1 });

    res.json({
      success: true,
      count: visits.length,
      data: visits,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch visits' });
  }
});

// @route   PATCH /api/visits/:id/status
// @desc    Seller confirms, reschedules, or completes visit
// @access  Private (Seller/Admin)
router.patch('/:id/status', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const { status, sellerNotes } = req.body;
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({ success: false, message: 'Visit not found' });
    }

    if (visit.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    if (status) visit.status = status;
    if (sellerNotes !== undefined) visit.sellerNotes = sellerNotes.trim();
    await visit.save();

    await Notification.create({
      recipient: visit.customer,
      title: `Visit Request ${status.toUpperCase()}`,
      message: `Your visit scheduled for ${new Date(
        visit.preferredDate
      ).toLocaleDateString()} was marked as "${status}".`,
      type: 'visit',
      link: '/customer/dashboard#visits',
    });

    res.json({
      success: true,
      message: 'Visit updated',
      data: visit,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update visit' });
  }
});

export default router;
