const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const { getClient } = require('./client');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Format phone number to standard ID format for wa.js
 * e.g. 0812... -> 62812...@c.us
 * e.g. 62812... -> 62812...@c.us
 */
function formatPhoneNumber(number) {
    let cleanNumber = number.replace(/[^0-9]/g, '');

    // Transform 08x to 628x (Indonesian numbers)
    if (cleanNumber.startsWith('0')) {
        cleanNumber = '62' + cleanNumber.substring(1);
    }

    if (!cleanNumber.endsWith('@c.us') && !cleanNumber.endsWith('@g.us')) {
        cleanNumber = cleanNumber + '@c.us';
    }

    return cleanNumber;
}

/**
 * Send a generic message (text or media)
 */
async function sendMessage(phoneNumber, textMessage, mediaUrl = null) {
    const client = getClient();

    if (!client) {
        throw new Error('WhatsApp client is not initialized');
    }

    // Double check if connected. However client might be ready but status is checking.
    // Actually, we should just let client.sendMessage fail if not connected.

    const formattedNumber = formatPhoneNumber(phoneNumber);

    try {
        // Check if number is registered on WhatsApp
        const isRegistered = await client.isRegisteredUser(formattedNumber);
        if (!isRegistered) {
            throw new Error(`Number ${phoneNumber} is not registered on WhatsApp`);
        }

        let response;

        if (mediaUrl) {
            // Handling media
            let media;
            if (mediaUrl.startsWith('http')) {
                // Send from URL
                media = await MessageMedia.fromUrl(mediaUrl);
            } else {
                // Send from local file
                const fullPath = path.join(__dirname, '..', '..', mediaUrl);
                if (!fs.existsSync(fullPath)) {
                    throw new Error('Media file not found: ' + mediaUrl);
                }
                media = MessageMedia.fromFilePath(fullPath);
            }

            // If there is text attached, send as caption
            response = await client.sendMessage(formattedNumber, media, {
                caption: textMessage || undefined
            });
        } else {
            // Text only
            response = await client.sendMessage(formattedNumber, textMessage);
        }

        logger.info(`✅ Message sent to ${phoneNumber}`);
        return { success: true, messageId: response.id.id };

    } catch (error) {
        logger.error(`❌ Failed to send message to ${phoneNumber}: ${error.message}`);
        throw error;
    }
}

/**
 * Helper to add delay between sends to prevent getting banned
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
    sendMessage,
    formatPhoneNumber,
    delay
};
