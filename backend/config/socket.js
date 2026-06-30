const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io;

// Initialize Socket.io
const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info('User connected via Socket.io', { 
      userId: socket.userId,
      socketId: socket.id 
    });

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join admin room if user is admin
    if (socket.userRole === 'admin') {
      socket.join('admins');
      logger.info('Admin joined admin room', { userId: socket.userId });
    }

    // Handle joining complaint room
    socket.on('join:complaint', (complaintId) => {
      socket.join(`complaint:${complaintId}`);
      logger.info('User joined complaint room', { 
        userId: socket.userId, 
        complaintId 
      });
    });

    // Handle leaving complaint room
    socket.on('leave:complaint', (complaintId) => {
      socket.leave(`complaint:${complaintId}`);
      logger.info('User left complaint room', { 
        userId: socket.userId, 
        complaintId 
      });
    });

    // Handle typing indicator
    socket.on('typing:start', (data) => {
      socket.to(`complaint:${data.complaintId}`).emit('user:typing', {
        userId: socket.userId,
        complaintId: data.complaintId
      });
    });

    socket.on('typing:stop', (data) => {
      socket.to(`complaint:${data.complaintId}`).emit('user:stopped-typing', {
        userId: socket.userId,
        complaintId: data.complaintId
      });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('User disconnected', { 
        userId: socket.userId,
        socketId: socket.id,
        reason 
      });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', { 
        userId: socket.userId,
        error: error.message 
      });
    });
  });

  logger.info('Socket.io initialized successfully');
  return io;
};

// Get Socket.io instance
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

// Emit to specific user
const emitToUser = (userId, event, data) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(event, data);
    logger.debug('Emitted to user', { userId, event });
  } catch (error) {
    logger.error('Failed to emit to user', { userId, event, error: error.message });
  }
};

// Emit to all admins
const emitToAdmins = (event, data) => {
  try {
    const io = getIO();
    io.to('admins').emit(event, data);
    logger.debug('Emitted to admins', { event });
  } catch (error) {
    logger.error('Failed to emit to admins', { event, error: error.message });
  }
};

// Emit to complaint room
const emitToComplaint = (complaintId, event, data) => {
  try {
    const io = getIO();
    io.to(`complaint:${complaintId}`).emit(event, data);
    logger.debug('Emitted to complaint room', { complaintId, event });
  } catch (error) {
    logger.error('Failed to emit to complaint', { complaintId, event, error: error.message });
  }
};

// Broadcast to all connected users
const broadcast = (event, data) => {
  try {
    const io = getIO();
    io.emit(event, data);
    logger.debug('Broadcasted event', { event });
  } catch (error) {
    logger.error('Failed to broadcast', { event, error: error.message });
  }
};

// Get connected users count
const getConnectedUsersCount = () => {
  try {
    const io = getIO();
    return io.sockets.sockets.size;
  } catch (error) {
    return 0;
  }
};

// Get users in room
const getUsersInRoom = (room) => {
  try {
    const io = getIO();
    const sockets = io.sockets.adapter.rooms.get(room);
    return sockets ? sockets.size : 0;
  } catch (error) {
    return 0;
  }
};

module.exports = {
  initializeSocket,
  getIO,
  emitToUser,
  emitToAdmins,
  emitToComplaint,
  broadcast,
  getConnectedUsersCount,
  getUsersInRoom
};
