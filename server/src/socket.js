const { Server } = require('socket.io');
const logger = require('./utils/logger');

let io = null;

function initSocket(httpServer) {
    io = new Server(httpServer, {
        cors: {
            origin: 'http://localhost:5173',
            credentials: true,
        },
    });

    io.on('connection', (socket) => {
        logger.info(`🔌 Client connected: ${socket.id}`);

        socket.on('disconnect', () => {
            logger.info(`🔌 Client disconnected: ${socket.id}`);
        });
    });

    logger.info('✅ Socket.IO initialized');
    return io;
}

function getIO() {
    if (!io) {
        throw new Error('Socket.IO not initialized. Call initSocket first.');
    }
    return io;
}

module.exports = { initSocket, getIO };
