const express = require('express');
const router = express.Router();
const { Message, Conversation, Notification } = require('../models/index');
const { protect } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/error');

// GET /api/chat/conversations
router.get('/conversations', protect, asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user._id, isActive: true })
    .populate('participants', 'name avatar role')
    .populate('lastMessage')
    .populate('listing', 'title images')
    .sort({ lastMessageAt: -1 });
  res.json({ success: true, data: conversations });
}));

// POST /api/chat/conversations — start or find conversation
router.post('/conversations', protect, asyncHandler(async (req, res) => {
  const { participantId, listingId } = req.body;
  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, participantId] },
    ...(listingId && { listing: listingId }),
  });
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participantId],
      listing: listingId || null,
    });
  }
  await conversation.populate('participants', 'name avatar role');
  res.json({ success: true, data: conversation });
}));

// GET /api/chat/conversations/:id/messages
router.get('/conversations/:id/messages', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id,
  });
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });

  const messages = await Message.find({ conversation: req.params.id, isDeleted: false })
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit));

  // Mark messages as read
  await Message.updateMany(
    { conversation: req.params.id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
    { $addToSet: { readBy: req.user._id } }
  );

  res.json({ success: true, data: messages.reverse() });
}));

// POST /api/chat/conversations/:id/messages
router.post('/conversations/:id/messages', protect, asyncHandler(async (req, res) => {
  const { content, type = 'text' } = req.body;
  const io = req.app.get('io');

  const conversation = await Conversation.findOne({
    _id: req.params.id,
    participants: req.user._id,
  });
  if (!conversation) return res.status(404).json({ success: false, message: 'Conversation not found.' });

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    content,
    type,
    readBy: [req.user._id],
  });
  await message.populate('sender', 'name avatar');

  conversation.lastMessage = message._id;
  conversation.lastMessageAt = new Date();
  await conversation.save();

  // Real-time emit to room
  io?.to(`conversation:${conversation._id}`).emit('message', message);

  // Notify other participant
  const otherId = conversation.participants.find(p => !p.equals(req.user._id));
  if (otherId) {
    const notif = await Notification.create({
      user: otherId,
      type: 'message',
      title: `New message from ${req.user.name}`,
      message: content.length > 80 ? content.slice(0, 80) + '...' : content,
      link: `/chat/${conversation._id}`,
    });
    io?.to(otherId.toString()).emit('notification', notif);
  }

  res.status(201).json({ success: true, data: message });
}));

module.exports = router;
