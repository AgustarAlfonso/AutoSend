const { Client, LocalAuth } = require('whatsapp-web.js');
const { PrismaClient } = require('@prisma/client');
const config = require('../config');
const logger = require('../utils/logger');
const { getIO } = require('../socket');

const prisma = new PrismaClient();

let waClient = null;
let connectionStatus = 'DISCONNECTED'; // DISCONNECTED, CONNECTING, CONNECTED

/**
 * Get the system user (admin) since we only support single user for now
 */
async function getSystemUser() {
    const user = await prisma.user.findFirst();
    if (!user) {
        throw new Error('System user not found. Please run seed first.');
    }
    return user;
}

/**
 * Update session status in DB
 */
async function updateSessionStatus(isConnected) {
    try {
        const user = await getSystemUser();

        await prisma.waSession.upsert({
            where: { userId: user.id },
            update: {
                isConnected,
                lastActive: new Date(),
            },
            create: {
                userId: user.id,
                isConnected,
                sessionData: {}, // LocalAuth handles actual file session, we just use this to track status
            },
        });

        connectionStatus = isConnected ? 'CONNECTED' : 'DISCONNECTED';

        // Broadcast status to clients
        try {
            getIO().emit('wa:status', { connected: isConnected, status: connectionStatus });
        } catch (e) {
            // Ignore if socket not ready
        }
    } catch (error) {
        logger.error('Failed to update session status in DB', { stack: error.stack });
    }
}

/**
 * Initialize WhatsApp Client
 */
async function initClient() {
    if (waClient) {
        logger.warn('WhatsApp client already initialized');
        return waClient;
    }

    logger.info('Initializing WhatsApp client...');
    connectionStatus = 'CONNECTING';

    waClient = new Client({
        authStrategy: new LocalAuth({
            dataPath: config.whatsapp.sessionPath,
            clientId: 'autosend-client',
        }),
        puppeteer: {
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
            headless: true, // run in background
        }
    });

    waClient.on('qr', (qr) => {
        logger.info('WhatsApp QR Code Generated. Please scan.');
        connectionStatus = 'WAITING_QR';
        try {
            getIO().emit('wa:qr', qr);
            getIO().emit('wa:status', { connected: false, status: connectionStatus });
        } catch (e) { }
    });

    waClient.on('ready', async () => {
        logger.info('✅ WhatsApp Client is READY');
        await updateSessionStatus(true);
        try {
            getIO().emit('wa:ready', { connected: true });
        } catch (e) { }
    });

    waClient.on('authenticated', () => {
        logger.info('WhatsApp Client Authenticated');
    });

    waClient.on('auth_failure', async (msg) => {
        logger.error('WhatsApp Authentication Failed', { message: msg });
        await updateSessionStatus(false);
        try {
            getIO().emit('wa:auth_failure', { message: msg });
        } catch (e) { }
    });

    waClient.on('disconnected', async (reason) => {
        logger.warn('WhatsApp Client Disconnected', { reason });
        await updateSessionStatus(false);
        try {
            getIO().emit('wa:disconnected', { reason });
        } catch (e) { }

        // Re-initialize client after a small delay
        setTimeout(() => {
            waClient.initialize().catch(err => {
                logger.error('Failed to re-initialize WhatsApp client', { stack: err.stack });
            });
        }, 5000);
    });

    try {
        await waClient.initialize();
    } catch (error) {
        logger.error('Failed to start WhatsApp client', { stack: error.stack });
        connectionStatus = 'DISCONNECTED';
    }

    return waClient;
}

/**
 * Force logout from WhatsApp
 */
async function logoutClient() {
    if (!waClient) return false;

    try {
        await waClient.logout();
        await updateSessionStatus(false);
        return true;
    } catch (error) {
        logger.error('Error logging out from WhatsApp', { stack: error.stack });
        return false;
    }
}

/**
 * Get current client instance
 */
function getClient() {
    return waClient;
}

/**
 * Get current connection status
 */
function getConnectionStatus() {
    return connectionStatus;
}

module.exports = {
    initClient,
    getClient,
    logoutClient,
    getConnectionStatus,
};
