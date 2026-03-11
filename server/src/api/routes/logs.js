const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/logs
router.get('/', async (req, res, next) => {
    try {
        const { status, limit = 50, skip = 0 } = req.query;

        const whereClause = {
            schedule: { userId: req.user.id }
        };

        if (status) {
            whereClause.status = status;
        }

        const [logs, total] = await Promise.all([
            prisma.messageLog.findMany({
                where: whereClause,
                include: {
                    schedule: { select: { title: true } },
                    contact: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(skip)
            }),
            prisma.messageLog.count({ where: whereClause })
        ]);

        res.json({ logs, total });
    } catch (error) {
        next(error);
    }
});

// GET /api/logs/missed
router.get('/missed', async (req, res, next) => {
    try {
        const logs = await prisma.messageLog.findMany({
            where: {
                schedule: { userId: req.user.id },
                status: 'MISSED'
            },
            include: {
                schedule: { select: { title: true, scheduledAt: true } },
                contact: { select: { name: true, phoneNumber: true } }
            },
            orderBy: { scheduledFor: 'asc' }
        });

        res.json(logs);
    } catch (error) {
        next(error);
    }
});

// POST /api/logs/:id/retry
router.post('/:id/retry', async (req, res, next) => {
    try {
        const { id } = req.params;

        const log = await prisma.messageLog.findUnique({
            where: { id },
            include: { schedule: true }
        });

        if (!log || log.schedule.userId !== req.user.id) {
            return res.status(404).json({ error: { message: 'Log not found' } });
        }

        if (log.status !== 'FAILED' && log.status !== 'MISSED') {
            return res.status(400).json({ error: { message: 'Only failed or missed messages can be retried' } });
        }

        // Set to pending so scheduler picks it up
        const updated = await prisma.messageLog.update({
            where: { id },
            data: {
                status: 'PENDING',
                scheduledFor: new Date(), // run immediately
                errorMessage: null
            }
        });

        res.json(updated);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
