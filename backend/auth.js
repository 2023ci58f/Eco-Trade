const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').isIn(['publisher', 'manufacturer']).withMessage('Role must be publisher or manufacturer'),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, password, role, company, phone } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered.' });

    const user = await User.create({ name, email, password, role, company, phone });
    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, company: user.company,
      },
    });
  })
);

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (user.isBanned) return res.status(403).json({ success: false, message: 'Account suspended.' });

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user._id);
    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        _id: user._id, name: user.name, email: user.email,
        role: user.role, avatar: user.avatar, company: user.company,
        rating: user.rating, totalReviews: user.totalReviews,
      },
    });
  })
);

// GET /api/auth/me
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, user });
}));

// PUT /api/auth/change-password
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 }),
  ],
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('+password');
    if (!(await user.comparePassword(req.body.currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    }
    user.password = req.body.newPassword;
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  })
);

module.exports = router;
