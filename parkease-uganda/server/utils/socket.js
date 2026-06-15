const { Server } = require('socket.io');
const logger = require('./logger');

let io;

exports.initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For development. Should be restricted in production.
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`, { module: 'socket' });

    // Allow clients to join a specific facility room to listen for updates
    socket.on('join_facility', (facilityId) => {
      socket.join(`facility_${facilityId}`);
      logger.info(`Socket ${socket.id} joined facility_${facilityId}`, { module: 'socket' });
    });

    socket.on('leave_facility', (facilityId) => {
      socket.leave(`facility_${facilityId}`);
      logger.info(`Socket ${socket.id} left facility_${facilityId}`, { module: 'socket' });
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`, { module: 'socket' });
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};
