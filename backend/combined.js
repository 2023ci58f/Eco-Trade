const express = require('express');

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
const reviewRouter = express.Router();
const { Review, Notification } = require('../models/index');
const User = require('../models/User');
const Order = require('../models/Order');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

reviewRouter.post('/', protect, asyncHandler(async (req, res) => {
  const { orderId, rating, title, comment, tags } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  if (!order.manufacturer.equals(req.user._id) && !order.publisher.equals(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }
  const revieweeId = req.user.role === 'manufacturer' ? order.publisher : order.manufacturer;
  const listingId = order.items[0]?.listing;
  const existing = await Review.findOne({ order: orderId, reviewer: req.user._id });
  if (existing) return res.status(409).json({ success: false, message: 'You already reviewed this order.' });
  const review = await Review.create({ order: orderId, reviewer: req.user._id, reviewee: revieweeId, listing: listingId, rating, title, comment, tags });
  const reviewee = await User.findById(revieweeId);
  if (reviewee) await reviewee.updateRating();
  res.status(201).json({ success: true, data: review });
}));

reviewRouter.get('/user/:userId', asyncHandler(async (req, res) => {
  const reviews = await Review.find({ reviewee: req.params.userId })
    .populate('reviewer', 'name avatar role')
    .populate('listing', 'title')
    .sort({ createdAt: -1 });
  res.json({ success: true, data: reviews });
}));

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
const notifRouter = express.Router();

notifRouter.get('/', protect, asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: notifications });
}));

notifRouter.put('/read-all', protect, asyncHandler(async (req, res) => {
  await Notification.updateMany({ user: req.user._id, read: false }, { read: true });
  res.json({ success: true, message: 'All notifications marked as read.' });
}));

notifRouter.put('/:id/read', protect, asyncHandler(async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true });
  res.json({ success: true });
}));

// ─── USERS ───────────────────────────────────────────────────────────────────
const userRouter = express.Router();

userRouter.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({ success: true, data: user });
}));

userRouter.put('/profile', protect, asyncHandler(async (req, res) => {
  const allowed = ['name', 'phone', 'company', 'bio', 'address'];
  const updates = {};
  allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true });
  res.json({ success: true, data: user });
}));

userRouter.get('/:id/public', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('name avatar role rating totalReviews company bio address.city address.state');
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  res.json({ success: true, data: user });
}));

// ─── ADMIN ───────────────────────────────────────────────────────────────────
const adminRouter = express.Router();
const Listing = require('../models/Listing');

adminRouter.use(protect, authorize('admin'));

adminRouter.get('/stats', asyncHandler(async (req, res) => {
  const [users, listings, orders] = await Promise.all([
    User.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]),
    Listing.countDocuments({ isActive: true }),
    Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } },
    ]),
  ]);
  res.json({ success: true, data: { users, listings, orders } });
}));

adminRouter.get('/users', asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;
  const query = {};
  if (role) query.role = role;
  if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
    User.countDocuments(query),
  ]);
  res.json({ success: true, data: users, pagination: { page: Number(page), total } });
}));

adminRouter.put('/users/:id/ban', asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, { isBanned: req.body.ban }, { new: true });
  res.json({ success: true, data: user });
}));

adminRouter.get('/listings', asyncHandler(async (req, res) => {
  const listings = await Listing.find().populate('publisher', 'name email').sort({ createdAt: -1 }).limit(50);
  res.json({ success: true, data: listings });
}));

adminRouter.put('/listings/:id/feature', asyncHandler(async (req, res) => {
  const listing = await Listing.findByIdAndUpdate(req.params.id, { isFeatured: req.body.featured }, { new: true });
  res.json({ success: true, data: listing });
}));

adminRouter.get('/orders', asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .populate('manufacturer', 'name email')
    .populate('publisher', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json({ success: true, data: orders });
}));

adminRouter.put('/orders/:id/resolve-dispute', asyncHandler(async (req, res) => {
  const order = await Order.findByIdAndUpdate(req.params.id, { isDisputed: false, status: req.body.resolution }, { new: true });
  res.json({ success: true, data: order });
}));

// ─── LOGISTICS ───────────────────────────────────────────────────────────────
const logisticsRouter = express.Router();
const { Pickup } = require('../models/index');

logisticsRouter.post('/schedule', protect, asyncHandler(async (req, res) => {
  const { orderId, scheduledDate, timeSlot, address } = req.body;
  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  const pickup = await Pickup.create({
    order: orderId,
    publisher: order.publisher,
    manufacturer: order.manufacturer,
    scheduledDate,
    timeSlot,
    address,
    trackingUpdates: [{ status: 'scheduled', note: 'Pickup scheduled' }],
  });
  res.status(201).json({ success: true, data: pickup });
}));

logisticsRouter.get('/order/:orderId', protect, asyncHandler(async (req, res) => {
  const pickup = await Pickup.findOne({ order: req.params.orderId }).populate('order', 'orderNumber status');
  res.json({ success: true, data: pickup });
}));

logisticsRouter.put('/:id/status', protect, asyncHandler(async (req, res) => {
  const { status, location, note } = req.body;
  const pickup = await Pickup.findById(req.params.id);
  if (!pickup) return res.status(404).json({ success: false, message: 'Pickup not found.' });
  pickup.status = status;
  pickup.trackingUpdates.push({ status, location, note });
  await pickup.save();
  res.json({ success: true, data: pickup });
}));

module.exports = { reviewRouter, notifRouter, userRouter, adminRouter, logisticsRouter };
