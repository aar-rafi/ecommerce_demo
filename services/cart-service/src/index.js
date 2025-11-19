const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const cartRoutes = require('./routes/cart');
const { connectRedis, closeRedis } = require('./config/redis');
const { logger } = require('./utils/logger');
const { setupMetrics, metricsMiddleware } = require('./utils/metrics');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5002;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: 'Too many requests from this IP'
});
app.use('/api/', limiter);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Metrics
setupMetrics(app);
app.use(metricsMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'cart-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Readiness check
app.get('/ready', async (req, res) => {
  try {
    const { redisClient } = require('./config/redis');
    await redisClient.ping();
    res.status(200).json({
      status: 'ready',
      redis: 'connected'
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      redis: 'disconnected'
    });
  }
});

// Routes
app.use('/api/cart', cartRoutes);

// Error handling
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectRedis();
    app.listen(PORT, () => {
      logger.info(`Cart Service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing server');
  await closeRedis();
  process.exit(0);
});

startServer();

module.exports = app;
