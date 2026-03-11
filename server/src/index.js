const http = require('http');
const app = require('./app');
const { initSocket } = require('./socket');
const config = require('./config');
const logger = require('./utils/logger');
const { initClient } = require('./whatsapp/client');
const { initScheduler } = require('./scheduler');

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initSocket(server);

// Initialize Services
initClient().catch(err => logger.error('WA Init Error', err));
initScheduler();

// --- Graceful Shutdown & Warning Logic ---
async function handleShutdown() {
    logger.info('Shutting down server...');

    try {
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();

        // Find upcoming schedules within 1 hour to warn user
        const now = new Date();
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

        const upcomingSchedules = await prisma.schedule.count({
            where: {
                status: 'ACTIVE',
                scheduledAt: {
                    gte: now,
                    lte: oneHourLater
                }
            }
        });

        if (upcomingSchedules > 0) {
            logger.warn(`⚠️ WARNING: There are ${upcomingSchedules} schedules queued to send in the next hour.`);
            logger.warn(`If the server remains off, these schedules will be MISSED.`);
        }

        // Clean up services
        const { logoutClient } = require('./whatsapp/client');
        const { stopScheduler } = require('./scheduler');

        stopScheduler();
        // We aren't fully unlinking Whatsapp session on shutdown, just memory cleanup
        // But localauth keeps session intact in .wwebjs_auth folder.

        await prisma.$disconnect();

        setTimeout(() => {
            logger.info('Server safely terminated.');
            process.exit(0);
        }, 1000);
    } catch (error) {
        logger.error('Error during shutdown', { stack: error.stack });
        process.exit(1);
    }
}

// Intercept stop signals
process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);
// ---------------------------------------

// Start server
server.listen(config.port, () => {
    logger.info(`🚀 AutoSend server running on http://localhost:${config.port}`);
    logger.info(`📊 Environment: ${config.nodeEnv}`);
    logger.info(`❤️  Health check: http://localhost:${config.port}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('🛑 SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('🛑 SIGINT received. Shutting down...');
    server.close(() => {
        logger.info('Server closed.');
        process.exit(0);
    });
});
