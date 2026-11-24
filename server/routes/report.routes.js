import express from 'express';
import { protect } from '../middleware/auth.js';
import Report from '../models/Report.js';
import Property from '../models/Property.js';

const router = express.Router();

// @route   POST /api/reports
// @desc    Report an illegitimate, fake, or spam listing
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { propertyId, reason, details } = req.body;

    if (!propertyId || !reason) {
      return res.status(400).json({ success: false, message: 'Property and reason are required' });
    }

    const report = await Report.create({
      property: propertyId,
      reportedBy: req.user._id,
      reason,
      details: details ? details.trim() : '',
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Listing report submitted. Our trust & safety team will review it shortly.',
      data: report,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not submit report' });
  }
});

export default router;
