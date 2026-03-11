const cron = require('node-cron');
const logger = require('../utils/logger');
const { processSchedules } = require('./processor');

let schedulerTask = null;

function initScheduler() {
    if (schedulerTask) {
        logger.warn('Scheduler is already running.');
        return;
    }

    logger.info('Initializing job scheduler...');

    // Running every 30 seconds
    schedulerTask = cron.schedule('*/30 * * * * *', async () => {
        await processSchedules();
    });

    schedulerTask.start();
    logger.info('✅ Job scheduler started');
}

function stopScheduler() {
    if (schedulerTask) {
        schedulerTask.stop();
        schedulerTask = null;
        logger.info('Job scheduler stopped');
    }
}

module.exports = {
    initScheduler,
    stopScheduler
};
