require('dotenv').config();

module.exports = {
    port: parseInt(process.env.PORT) || 3001,
    nodeEnv: process.env.NODE_ENV || 'development',
    database: {
        url: process.env.DATABASE_URL,
    },
    jwt: {
        secret: process.env.JWT_SECRET || 'fallback-secret',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
    whatsapp: {
        sessionPath: process.env.WA_SESSION_PATH || '.wwebjs_auth',
    },
    upload: {
        dir: process.env.UPLOAD_DIR || 'uploads',
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 16 * 1024 * 1024, // 16MB
    },
};
