import express from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';
import Property from '../models/Property.js';

const router = express.Router();

// @route   POST /api/favourites/:propertyId
// @desc    Toggle favourite on a property
// @access  Private
router.post('/:propertyId', protect, async (req, res) => {
  try {
    const { propertyId } = req.params;
    const user = await User.findById(req.user._id);

    const exists = user.favorites.some((fav) => fav.toString() === propertyId);
    let isFavorited = false;

    if (exists) {
      user.favorites = user.favorites.filter((fav) => fav.toString() !== propertyId);
      isFavorited = false;
    } else {
      user.favorites.push(propertyId);
      isFavorited = true;
    }

    await user.save();

    res.json({
      success: true,
      isFavorited,
      message: isFavorited ? 'Property added to saved favorites!' : 'Property removed from favorites.',
      totalFavorites: user.favorites.length,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not toggle favorite' });
  }
});

// @route   GET /api/favourites
// @desc    Get all saved properties of current user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: 'favorites',
      populate: {
        path: 'seller',
        select: 'name phone isVerified subscription',
      },
    });

    res.json({
      success: true,
      count: user.favorites.length,
      data: user.favorites,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch favorites' });
  }
});

export default router;
