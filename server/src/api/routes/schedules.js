const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/schedules
router.get('/', async (req, res, next) => {
    try {
        const { status } = req.query;

        const whereClause = { userId: req.user.id };
        if (status) {
            whereClause.status = status;
        }

        const schedules = await prisma.schedule.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { recipients: true, logs: true }
                }
            },
            orderBy: { scheduledAt: 'asc' }
        });

        res.json(schedules);
    } catch (error) {
        next(error);
    }
});

// GET /api/schedules/:id
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const schedule = await prisma.schedule.findUnique({
            where: { id },
            include: {
                recipients: {
                    include: { contact: true }
                },
                logs: {
                    take: 10,
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!schedule || schedule.userId !== req.user.id) {
            return res.status(404).json({ error: { message: 'Schedule not found' } });
        }

        res.json(schedule);
    } catch (error) {
        next(error);
    }
});

// POST /api/schedules
router.post('/', async (req, res, next) => {
    try {
        const {
            title,
            message,
            scheduledAt,
            scheduleType,
            contactIds,
            cronExpression,
            endsAt,
            maxRepeats
        } = req.body;

        if (!title || !message || !scheduledAt || !scheduleType || !contactIds || !contactIds.length) {
            return res.status(400).json({ error: { message: 'Missing required fields' } });
        }

        // Verify contacts belong to user
        const contacts = await prisma.contact.findMany({
            where: {
                id: { in: contactIds },
                userId: req.user.id
            }
        });

        if (contacts.length !== contactIds.length) {
            return res.status(400).json({ error: { message: 'Some contacts are invalid' } });
        }

        const schedule = await prisma.schedule.create({
            data: {
                userId: req.user.id,
                title,
                message,
                scheduledAt: new Date(scheduledAt),
                scheduleType,
                cronExpression,
                endsAt: endsAt ? new Date(endsAt) : null,
                maxRepeats: maxRepeats ? parseInt(maxRepeats) : null,
                recipients: {
                    create: contactIds.map(contactId => ({
                        contactId
                    }))
                }
            },
            include: {
                recipients: true
            }
        });

        res.status(201).json(schedule);
    } catch (error) {
        next(error);
    }
});

// PATCH /api/schedules/:id/pause
router.patch('/:id/pause', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'ACTIVE' or 'PAUSED'

        if (!['ACTIVE', 'PAUSED'].includes(status)) {
            return res.status(400).json({ error: { message: 'Invalid status' } });
        }

        const schedule = await prisma.schedule.findUnique({ where: { id } });

        if (!schedule || schedule.userId !== req.user.id) {
            return res.status(404).json({ error: { message: 'Schedule not found' } });
        }

        const updated = await prisma.schedule.update({
            where: { id },
            data: { status }
        });

        res.json(updated);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const schedule = await prisma.schedule.findUnique({ where: { id } });

        if (!schedule || schedule.userId !== req.user.id) {
            return res.status(404).json({ error: { message: 'Schedule not found' } });
        }

        // Related recipients and logs handled by cascade/application logic 
        // depending on the schema specifics. Recipients cascade in prisma schema.
        await prisma.schedule.delete({ where: { id } });

        res.json({ message: 'Schedule deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
