const express = require('express');
const { PrismaClient } = require('@prisma/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Protect all contact routes
router.use(authMiddleware);

// GET /api/contacts - List all contacts 
router.get('/', async (req, res, next) => {
    try {
        const contacts = await prisma.contact.findMany({
            where: { userId: req.user.id },
            include: {
                _count: {
                    select: { schedules: true }
                }
            },
            orderBy: { name: 'asc' }
        });
        res.json(contacts);
    } catch (error) {
        next(error);
    }
});

// POST /api/contacts - Create a new contact
router.post('/', async (req, res, next) => {
    try {
        const { name, phoneNumber } = req.body;

        if (!name || !phoneNumber) {
            return res.status(400).json({ error: { message: 'Name and phone number are required' } });
        }

        // Format phone number to standard format if needed (simple clean up for now)
        const cleanedPhone = phoneNumber.replace(/[^0-9]/g, '');

        const contact = await prisma.contact.create({
            data: {
                name,
                phoneNumber: cleanedPhone,
                userId: req.user.id
            }
        });

        res.status(201).json(contact);
    } catch (error) {
        next(error);
    }
});

// PUT /api/contacts/:id - Update contact
router.put('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, phoneNumber } = req.body;

        const contact = await prisma.contact.findUnique({
            where: { id }
        });

        if (!contact || contact.userId !== req.user.id) {
            return res.status(404).json({ error: { message: 'Contact not found' } });
        }

        const cleanedPhone = phoneNumber ? phoneNumber.replace(/[^0-9]/g, '') : undefined;

        const updatedContact = await prisma.contact.update({
            where: { id },
            data: {
                name: name || undefined,
                phoneNumber: cleanedPhone || undefined
            }
        });

        res.json(updatedContact);
    } catch (error) {
        next(error);
    }
});

// DELETE /api/contacts/:id - Delete contact
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const contact = await prisma.contact.findUnique({
            where: { id }
        });

        if (!contact || contact.userId !== req.user.id) {
            return res.status(404).json({ error: { message: 'Contact not found' } });
        }

        await prisma.contact.delete({
            where: { id }
        });

        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
