const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Listing = require('../models/Listing');
const { Notification } = require('../models/index');
const { protect, authorize } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

const notifyUser = async (io, userId, notification) => {
  const notif = await Notification.create({ user: userId, ...notification });
  io?.to(userId.toString()).emit('notification', notif);
};

// POST /api/orders — manufacturer places order
router.post('/', protect, authorize('manufacturer'), asyncHandler(async (req, res) => {
  const { items, shippingAddress, pickupType, pickupSchedule, notes, payment } = req.body;
  const io = req.app.get('io');

  let subtotal = 0;
  const orderItems = [];

  for (const item of items) {
    const listing = await Listing.findById(item.listingId);
    if (!listing || listing.availability !== 'available') {
      return res.status(400).json({ success: false, message: `Listing ${item.listingId} not available.` });
    }
    const totalPrice = listing.price.amount * item.quantity;
    subtotal += totalPrice;
    orderItems.push({
      listing: listing._id,
      title: listing.title,
      quantity: item.quantity,
      unit: listing.quantity.unit,
      pricePerUnit: listing.price.amount,
      totalPrice,
    });
  }

  const tax = Math.round(subtotal * 0.18);
  const deliveryCharge = pickupType === 'door_delivery' ? 500 : 0;
  const totalAmount = subtotal + tax + deliveryCharge;

  const order = await Order.create({
    manufacturer: req.user._id,
    publisher: orderItems[0].listing ? (await Listing.findById(orderItems[0].listing)).publisher : null,
    items: orderItems,
    subtotal, tax, deliveryCharge, totalAmount,
    shippingAddress, pickupType, pickupSchedule, notes,
    payment: { method: payment?.method || 'cod', status: 'pending' },
    statusHistory: [{ status: 'pending', note: 'Order placed by manufacturer' }],
  });

  // Populate publisher from first listing
  const firstListing = await Listing.findById(orderItems[0].listing);
  if (firstListing) {
    await notifyUser(io, firstListing.publisher, {
      type: 'order',
      title: 'New Order Received',
      message: `You received a new order #${order.orderNumber}`,
      link: `/publisher/orders/${order._id}`,
    });
  }

  const populated = await Order.findById(order._id)
    .populate('manufacturer', 'name email phone')
    .populate('publisher', 'name email phone')
    .populate('items.listing', 'title images');

  res.status(201).json({ success: true, message: 'Order placed successfully.', data: populated });
}));

// GET /api/orders — list orders for current user
router.get('/', protect, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const query = req.user.role === 'manufacturer'
    ? { manufacturer: req.user._id }
    : { publisher: req.user._id };
  if (status) query.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('manufacturer', 'name avatar')
      .populate('publisher', 'name avatar')
      .populate('items.listing', 'title images category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Order.countDocuments(query),
  ]);

  res.json({ success: true, data: orders, pagination: { page: Number(page), limit: Number(limit), total } });
}));

// GET /api/orders/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('manufacturer', 'name email phone avatar company address')
    .populate('publisher', 'name email phone avatar company address')
    .populate('items.listing', 'title images category location');

  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
  const isParty = order.manufacturer._id.equals(req.user._id) || order.publisher._id.equals(req.user._id);
  if (!isParty && req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Unauthorized.' });

  res.json({ success: true, data: order });
}));

// PUT /api/orders/:id/status — update order status
router.put('/:id/status', protect, asyncHandler(async (req, res) => {
  const { status, note } = req.body;
  const io = req.app.get('io');
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

  const publisherStatuses = ['confirmed', 'processing', 'ready_for_pickup', 'picked_up'];
  const manufacturerStatuses = ['cancelled'];
  const adminStatuses = ['disputed'];

  const allowed =
    (req.user.role === 'publisher' && publisherStatuses.includes(status) && order.publisher.equals(req.user._id)) ||
    (req.user.role === 'manufacturer' && manufacturerStatuses.includes(status) && order.manufacturer.equals(req.user._id)) ||
    (req.user.role === 'admin');

  if (!allowed) return res.status(403).json({ success: false, message: 'Not authorized to update this status.' });

  order.status = status;
  order.statusHistory.push({ status, note, updatedBy: req.user._id });
  await order.save();

  // Notify opposite party
  const notifyId = req.user.role === 'publisher' ? order.manufacturer : order.publisher;
  await notifyUser(io, notifyId, {
    type: 'order',
    title: 'Order Updated',
    message: `Order #${order.orderNumber} status changed to ${status.replace(/_/g, ' ')}`,
    link: `/orders/${order._id}`,
  });

  res.json({ success: true, message: 'Status updated.', data: order });
}));

module.exports = router;
