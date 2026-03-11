const jwt = require('jsonwebtoken');
const config = require('../../config');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: { message: 'Unauthorized: No token provided' } });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, config.jwt.secret);

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, username: true },
        });

        if (!user) {
            return res.status(401).json({ error: { message: 'Unauthorized: Invalid token' } });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: { message: 'Unauthorized: Token expired' } });
        }
        return res.status(401).json({ error: { message: 'Unauthorized: Invalid token' } });
    }
};

module.exports = authMiddleware;
