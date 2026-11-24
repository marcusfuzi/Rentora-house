import express from 'express';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// @route   POST /api/upload
// @desc    Upload up to 5 property photos
// @access  Private (Seller/Admin)
router.post('/', protect, authorize('seller', 'admin'), upload.array('images', 5), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No images uploaded' });
    }

    const urls = req.files.map((file) => `/uploads/${file.filename}`);

    res.json({
      success: true,
      message: `${urls.length} images uploaded successfully`,
      urls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Image upload failed' });
  }
});

export default router;
