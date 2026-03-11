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

// POST /api/contacts/sync - Sync contacts from WhatsApp
router.post('/sync', async (req, res, next) => {
    try {
        const { getClient, getConnectionStatus } = require('../../whatsapp/client');
        const client = getClient();
        const status = getConnectionStatus();

        if (!client || status !== 'CONNECTED') {
            return res.status(400).json({ error: { message: 'WhatsApp belum terhubung' } });
        }

        const waContacts = await client.getContacts();
        // Filter out groups, verify it is a synced contact, and tightly reject Meta multi-device LID numbers
        const myContacts = waContacts.filter(c => c.isMyContact && !c.isGroup && c.id && c.id.server === 'c.us');

        const existingContacts = await prisma.contact.findMany({
            where: { userId: req.user.id },
            select: { phoneNumber: true }
        });
        const existingPhones = new Set(existingContacts.map(c => c.phoneNumber));

        const newContacts = [];
        for (const c of myContacts) {
            const phone = c.number;
            if (!phone) continue;

            const cleanPhone = phone.replace(/[^0-9]/g, '');

            if (!existingPhones.has(cleanPhone)) {
                newContacts.push({
                    userId: req.user.id,
                    name: c.name || c.pushname || cleanPhone,
                    phoneNumber: cleanPhone
                });
                existingPhones.add(cleanPhone);
            }
        }

        if (newContacts.length > 0) {
            await prisma.contact.createMany({
                data: newContacts,
            });
        }

        res.json({ message: 'Sinkronisasi berhasil', syncedCount: newContacts.length });
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

// DELETE /api/contacts/all - Delete ALL contacts
router.delete('/all', async (req, res, next) => {
    console.log('HIT DELETE ALL CONTACTS');
    try {
        // Because contacts are linked to schedules and logs, we must delete them transactionally
        // We will just clear all child links of the contacts first
        const userContacts = await prisma.contact.findMany({
            where: { userId: req.user.id },
            select: { id: true }
        });

        const contactIds = userContacts.map(c => c.id);

        if (contactIds.length > 0) {
            await prisma.$transaction([
                prisma.messageLog.deleteMany({
                    where: { contactId: { in: contactIds } }
                }),
                prisma.scheduleRecipient.deleteMany({
                    where: { contactId: { in: contactIds } }
                }),
                prisma.contact.deleteMany({
                    where: { id: { in: contactIds } }
                })
            ]);
        }

        res.json({ message: 'Semua kontak dan relasi jadwal berhasil dihapus' });
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
