const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = (io) => {
  // Authenticate socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${socket.user.name} (${userId})`);

    // Join personal room for notifications
    socket.join(userId);

    // Join conversation room
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicator
    socket.on('typing', ({ conversationId, isTyping }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        userId,
        name: socket.user.name,
        isTyping,
      });
    });

    // Online status
    socket.broadcast.emit('user_online', { userId });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.name}`);
      socket.broadcast.emit('user_offline', { userId });
    });
  });
};
