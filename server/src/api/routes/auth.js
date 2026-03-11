const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const config = require('../../config');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: { message: 'Username and password are required' } });
        }

        const user = await prisma.user.findUnique({ where: { username } });

        if (!user) {
            return res.status(401).json({ error: { message: 'Invalid username or password' } });
        }

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
            return res.status(401).json({ error: { message: 'Invalid username or password' } });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username },
            config.jwt.secret,
            { expiresIn: config.jwt.expiresIn }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
            },
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/logout (Client side handles token deletion, this just returns OK)
router.post('/logout', (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
