const express = require('express');
const { getConnectionStatus, logoutClient } = require('../../whatsapp/client');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET /api/whatsapp/status
router.get('/status', (req, res) => {
    const status = getConnectionStatus();

    res.json({
        status,
        connected: status === 'CONNECTED',
        waitingQr: status === 'WAITING_QR'
    });
});

// POST /api/whatsapp/logout
router.post('/logout', async (req, res, next) => {
    try {
        const success = await logoutClient();
        if (success) {
            res.json({ message: 'WhatsApp logged out successfully' });
        } else {
            res.status(500).json({ error: { message: 'Failed to logout from WhatsApp' } });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
