const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/dashboard/stats
router.get('/stats', async (req, res, next) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const [sentToday, failedToday, pendingToday, activeSchedules] = await Promise.all([
            // Count sent today
            prisma.messageLog.count({
                where: {
                    schedule: { userId: req.user.id },
                    status: 'SENT',
                    sentAt: { gte: startOfDay }
                }
            }),
            // Count failed today
            prisma.messageLog.count({
                where: {
                    schedule: { userId: req.user.id },
                    status: 'FAILED',
                    createdAt: { gte: startOfDay }
                }
            }),
            // Count pending today
            prisma.messageLog.count({
                where: {
                    schedule: { userId: req.user.id },
                    status: 'PENDING',
                    scheduledFor: { gte: startOfDay }
                }
            }),
            // Count total active schedules
            prisma.schedule.count({
                where: {
                    userId: req.user.id,
                    status: 'ACTIVE'
                }
            })
        ]);

        // Check for missed messages
        const missedCount = await prisma.messageLog.count({
            where: {
                schedule: { userId: req.user.id },
                status: 'MISSED'
            }
        });

        res.json({
            sentToday,
            failedToday,
            pendingToday,
            activeSchedules,
            hasMissedMessages: missedCount > 0
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/dashboard/upcoming
router.get('/upcoming', async (req, res, next) => {
    try {
        const upcomingSchedules = await prisma.schedule.findMany({
            where: {
                userId: req.user.id,
                status: 'ACTIVE',
                scheduledAt: { gte: new Date() }
            },
            orderBy: { scheduledAt: 'asc' },
            take: 5,
            include: {
                _count: {
                    select: { recipients: true }
                }
            }
        });

        res.json(upcomingSchedules);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
