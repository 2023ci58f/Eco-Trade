import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket?.connected) return socket;
  socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
    auth: { token },
    transports: ['websocket'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
  socket.on('connect', () => console.log('Socket connected:', socket.id));
  socket.on('disconnect', () => console.log('Socket disconnected'));
  socket.on('connect_error', (err) => console.error('Socket error:', err.message));
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};

export const joinConversation = (conversationId) => {
  socket?.emit('join_conversation', conversationId);
};

export const leaveConversation = (conversationId) => {
  socket?.emit('leave_conversation', conversationId);
};

export const sendTyping = (conversationId, isTyping) => {
  socket?.emit('typing', { conversationId, isTyping });
};
