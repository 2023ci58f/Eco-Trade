const express = require('express');
const router = express.Router();
const Listing = require('../models/Listing');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');
const { uploadToS3, deleteFromS3 } = require('../config/s3');

// GET /api/listings — public browse with filters
router.get('/', asyncHandler(async (req, res) => {
  const {
    search, category, city, state, minPrice, maxPrice,
    condition, page = 1, limit = 12, sortBy = 'createdAt', order = 'desc',
  } = req.query;

  const query = { isActive: true, availability: 'available' };

  if (search) query.$text = { $search: search };
  if (category) query.category = category;
  if (city) query['location.city'] = new RegExp(city, 'i');
  if (state) query['location.state'] = new RegExp(state, 'i');
  if (condition) query.condition = condition;
  if (minPrice || maxPrice) {
    query['price.amount'] = {};
    if (minPrice) query['price.amount'].$gte = Number(minPrice);
    if (maxPrice) query['price.amount'].$lte = Number(maxPrice);
  }

  const skip = (Number(page) - 1) * Number(limit);
  const sortObj = { [sortBy]: order === 'asc' ? 1 : -1 };

  const [listings, total] = await Promise.all([
    Listing.find(query)
      .populate('publisher', 'name avatar rating company city')
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit)),
    Listing.countDocuments(query),
  ]);

  res.json({
    success: true,
    data: listings,
    pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
  });
}));

// GET /api/listings/categories
router.get('/categories', asyncHandler(async (req, res) => {
  const categories = await Listing.aggregate([
    { $match: { isActive: true, availability: 'available' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  res.json({ success: true, data: categories });
}));

// GET /api/listings/my — publisher's own listings
router.get('/my', protect, authorize('publisher'), asyncHandler(async (req, res) => {
  const listings = await Listing.find({ publisher: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: listings });
}));

// GET /api/listings/:id
router.get('/:id', asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate('publisher', 'name avatar rating company address phone bio totalReviews');
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
  listing.views += 1;
  await listing.save();
  res.json({ success: true, data: listing });
}));

// POST /api/listings — publisher creates listing
router.post('/', protect, authorize('publisher'), asyncHandler(async (req, res) => {
  const listing = await Listing.create({ ...req.body, publisher: req.user._id });
  res.status(201).json({ success: true, message: 'Listing created successfully.', data: listing });
}));

// PUT /api/listings/:id — publisher updates own listing
router.put('/:id', protect, authorize('publisher'), asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({ _id: req.params.id, publisher: req.user._id });
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found or unauthorized.' });
  Object.assign(listing, req.body);
  await listing.save();
  res.json({ success: true, message: 'Listing updated.', data: listing });
}));

// DELETE /api/listings/:id
router.delete('/:id', protect, authorize('publisher', 'admin'), asyncHandler(async (req, res) => {
  const listing = await Listing.findOne({
    _id: req.params.id,
    ...(req.user.role !== 'admin' && { publisher: req.user._id }),
  });
  if (!listing) return res.status(404).json({ success: false, message: 'Listing not found.' });
  listing.isActive = false;
  await listing.save();
  res.json({ success: true, message: 'Listing removed.' });
}));

module.exports = router;
