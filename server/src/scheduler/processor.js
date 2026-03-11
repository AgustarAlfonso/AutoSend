const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const { sendMessage, delay } = require('../whatsapp/sender');
const { getConnectionStatus } = require('../whatsapp/client');
const logger = require('../utils/logger');
const { getIO } = require('../socket');
const cronParser = require('cron-parser'); // We need to add this to package.json later

const prisma = new PrismaClient();

async function processSchedules() {
    // Only process if WhatsApp is connected
    if (getConnectionStatus() !== 'CONNECTED') {
        logger.debug('Skipping schedule processing: WhatsApp not connected');
        return;
    }

    logger.debug('Running schedule processor...');

    try {
        const now = new Date();

        // 1. Check for MISSED schedules from when server was off
        // We look for schedules that should have been run, but didn't create a PENDING log today.
        // Instead of doing complex logic here, we'll let the user retry missed logs.
        // For now, let's grab ACTIVE schedules that are due

        const dueSchedules = await prisma.schedule.findMany({
            where: {
                status: 'ACTIVE',
                scheduledAt: { lte: now }
            },
            include: {
                recipients: {
                    include: { contact: true }
                }
            }
        });

        if (dueSchedules.length === 0) return;

        logger.info(`Found ${dueSchedules.length} schedules due for processing`);

        for (const schedule of dueSchedules) {
            // 2. Process each recipient
            let sentCount = 0;
            let failedCount = 0;

            for (let i = 0; i < schedule.recipients.length; i++) {
                const recipient = schedule.recipients[i];
                const phone = recipient.contact.phoneNumber;

                // Create log entry
                const log = await prisma.messageLog.create({
                    data: {
                        scheduleId: schedule.id,
                        contactId: recipient.contactId,
                        phoneNumber: phone,
                        scheduledFor: schedule.scheduledAt,
                        status: 'PENDING'
                    }
                });

                try {
                    // Send message
                    await sendMessage(phone, schedule.message, schedule.mediaUrl);

                    // Update log
                    await prisma.messageLog.update({
                        where: { id: log.id },
                        data: {
                            status: 'SENT',
                            sentAt: new Date()
                        }
                    });

                    sentCount++;
                } catch (error) {
                    // Update log
                    await prisma.messageLog.update({
                        where: { id: log.id },
                        data: {
                            status: 'FAILED',
                            errorMessage: error.message
                        }
                    });

                    failedCount++;

                    // Notify frontend
                    try {
                        getIO().emit('notification:failed', {
                            logId: log.id,
                            phone,
                            error: error.message
                        });
                    } catch (e) { }
                }

                // Delay between sends (except the last one) to prevent spam
                if (i < schedule.recipients.length - 1) {
                    await delay(5000); // 5 seconds wait
                }
            }

            // Notify completion
            try {
                getIO().emit('schedule:complete', {
                    scheduleId: schedule.id,
                    sent: sentCount,
                    failed: failedCount
                });
            } catch (e) { }

            // 3. Update Schedule Status or Calculate Next Run
            if (schedule.scheduleType === 'ONCE') {
                await prisma.schedule.update({
                    where: { id: schedule.id },
                    data: { status: 'COMPLETED' }
                });
            } else {
                // Handle recurring schedules
                let nextDate = null;
                let shouldStop = false;

                // Check max repeats
                const newRepeatCount = schedule.repeatCount + 1;
                if (schedule.maxRepeats && newRepeatCount >= schedule.maxRepeats) {
                    shouldStop = true;
                }

                if (!shouldStop) {
                    // Calculate next date based on type
                    const current = new Date(schedule.scheduledAt);

                    switch (schedule.scheduleType) {
                        case 'DAILY':
                            current.setDate(current.getDate() + 1);
                            nextDate = current;
                            break;
                        case 'WEEKLY':
                            current.setDate(current.getDate() + 7);
                            nextDate = current;
                            break;
                        case 'MONTHLY':
                            current.setMonth(current.getMonth() + 1);
                            nextDate = current;
                            break;
                        case 'CUSTOM':
                            if (schedule.cronExpression) {
                                try {
                                    const interval = cronParser.parseExpression(schedule.cronExpression, { currentDate: current });
                                    nextDate = interval.next().toDate();
                                } catch (err) {
                                    logger.error(`Invalid cron expression for schedule ${schedule.id}: ${err.message}`);
                                    shouldStop = true;
                                }
                            } else {
                                shouldStop = true;
                            }
                            break;
                    }

                    // Check endsAt
                    if (nextDate && schedule.endsAt && nextDate > schedule.endsAt) {
                        shouldStop = true;
                    }
                }

                await prisma.schedule.update({
                    where: { id: schedule.id },
                    data: {
                        status: shouldStop ? 'COMPLETED' : 'ACTIVE',
                        scheduledAt: shouldStop ? schedule.scheduledAt : nextDate,
                        repeatCount: newRepeatCount
                    }
                });
            }
        }

    } catch (error) {
        logger.error('Error in schedule processor', { stack: error.stack });
    }
}

module.exports = {
    processSchedules
};
