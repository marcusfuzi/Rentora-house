import express from 'express';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Helper to format user response
const formatUserResponse = (user) => {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    address: user.address,
    isVerified: user.isVerified,
    subscription: user.subscription,
    favorites: user.favorites || [],
    createdAt: user.createdAt,
  };
};

// @route   POST /api/auth/register
// @desc    Register a new customer or seller
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists',
      });
    }

    // Role can only be customer or seller on registration (admin cannot be registered publicly)
    const assignedRole = role === 'seller' ? 'seller' : 'customer';

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone: phone ? phone.trim() : '',
      role: assignedRole,
      address: address || {},
      isVerified: assignedRole === 'customer',
      subscription: {
        plan: 'free',
        status: 'active',
        listingLimit: assignedRole === 'seller' ? 2 : 0,
        sponsoredSlots: 0,
        sponsoredSlotsUsed: 0,
      },
    });

    const token = user.generateAuthToken();

    res.status(201).json({
      success: true,
      message: `Account created successfully as ${assignedRole}`,
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration',
    });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password',
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Optional check: if role was specified in login, verify role matches
    if (role && role !== user.role && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: `This account is registered as a ${user.role}. Please select ${user.role} to login.`,
      });
    }

    const token = user.generateAuthToken();

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during login',
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('favorites', 'title rent bhk propertyType images location isSponsored');
    res.json({
      success: true,
      user: formatUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
    });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, address, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (avatar !== undefined) user.avatar = avatar;
    if (address) {
      user.address = {
        ...user.address,
        ...address,
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserResponse(user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
    });
  }
});

export default router;
