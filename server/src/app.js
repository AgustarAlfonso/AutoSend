const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', config.upload.dir)));

// API Routes
const apiRouter = require('./api');
app.use('/api', apiRouter);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const logger = require('./utils/logger');
    logger.error(err.message, { stack: err.stack });

    res.status(err.status || 500).json({
        error: {
            message: err.message || 'Internal Server Error',
            ...(config.nodeEnv === 'development' && { stack: err.stack }),
        },
    });
});

module.exports = app;
