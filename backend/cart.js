// ============================================================
// cart.js
// ============================================================
const express = require('express');
const cartRouter = express.Router();
const { Cart } = require('../models/index');
const Listing = require('../models/Listing');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

cartRouter.get('/', protect, authorize('manufacturer'), asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate({
    path: 'items.listing',
    populate: { path: 'publisher', select: 'name avatar rating' },
  });
  res.json({ success: true, data: cart || { items: [] } });
}));

cartRouter.post('/add', protect, authorize('manufacturer'), asyncHandler(async (req, res) => {
  const { listingId, quantity = 1 } = req.body;
  const listing = await Listing.findById(listingId);
  if (!listing || listing.availability !== 'available') {
    return res.status(400).json({ success: false, message: 'Listing not available.' });
  }
  let cart = await Cart.findOne({ user: req.user._id });
  if (!cart) cart = new Cart({ user: req.user._id, items: [] });
  const idx = cart.items.findIndex(i => i.listing.equals(listingId));
  if (idx >= 0) cart.items[idx].quantity += quantity;
  else cart.items.push({ listing: listingId, quantity });
  await cart.save();
  res.json({ success: true, message: 'Item added to cart.', data: cart });
}));

cartRouter.put('/item/:listingId', protect, authorize('manufacturer'), asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });
  const item = cart.items.find(i => i.listing.equals(req.params.listingId));
  if (!item) return res.status(404).json({ success: false, message: 'Item not in cart.' });
  if (quantity <= 0) cart.items = cart.items.filter(i => !i.listing.equals(req.params.listingId));
  else item.quantity = quantity;
  await cart.save();
  res.json({ success: true, data: cart });
}));

cartRouter.delete('/item/:listingId', protect, authorize('manufacturer'), asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) return res.status(404).json({ success: false, message: 'Cart not found.' });
  cart.items = cart.items.filter(i => !i.listing.equals(req.params.listingId));
  await cart.save();
  res.json({ success: true, message: 'Item removed.', data: cart });
}));

cartRouter.delete('/clear', protect, authorize('manufacturer'), asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
  res.json({ success: true, message: 'Cart cleared.' });
}));

module.exports = cartRouter;
