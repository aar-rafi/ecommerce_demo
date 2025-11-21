const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { setupMetrics, metricsMiddleware } = require('./utils/metrics');
const { authMiddleware } = require('./middleware/auth');
const { circuitBreaker } = require('./middleware/circuitBreaker');

const app = express();
const PORT = process.env.PORT || 4000;

// Security
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 100, // 100 requests per minute per IP
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// Metrics (before body parsing)
setupMetrics(app);
app.use(metricsMiddleware);

// Body parsing - SKIP for proxy routes to avoid consuming request stream
app.use((req, res, next) => {
  // Don't parse body for routes that will be proxied
  if (req.path.startsWith('/api/')) {
    return next();
  }
  express.json()(req, res, next);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/ready', async (req, res) => {
  // Check if all services are reachable
  const axios = require('axios');
  const services = [
    { name: 'auth', url: process.env.AUTH_SERVICE_URL },
    { name: 'products', url: process.env.PRODUCT_SERVICE_URL },
    { name: 'cart', url: process.env.CART_SERVICE_URL },
    { name: 'orders', url: process.env.ORDER_SERVICE_URL }
  ];

  const checks = await Promise.allSettled(
    services.map(s => axios.get(`${s.url}/health`, { timeout: 2000 }))
  );

  const allHealthy = checks.every(c => c.status === 'fulfilled');

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? 'ready' : 'not ready',
    services: services.map((s, i) => ({
      name: s.name,
      status: checks[i].status === 'fulfilled' ? 'up' : 'down'
    }))
  });
});

// Service URLs
const AUTH_SERVICE = process.env.AUTH_SERVICE_URL || 'http://localhost:5000';
const PRODUCT_SERVICE = process.env.PRODUCT_SERVICE_URL || 'http://localhost:5001';
const CART_SERVICE = process.env.CART_SERVICE_URL || 'http://localhost:5002';
const ORDER_SERVICE = process.env.ORDER_SERVICE_URL || 'http://localhost:5003';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:5004';

// Proxy configurations
const proxyOptions = {
  changeOrigin: true,
  logLevel: 'debug',
  timeout: 60000, // 60 seconds
  proxyTimeout: 60000, // 60 seconds
  onError: (err, req, res) => {
    logger.error('Proxy error:', {
      message: err.message,
      code: err.code,
      errno: err.errno,
      stack: err.stack
    });
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'The requested service is not responding',
      details: err.message
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    logger.info(`Proxying ${req.method} ${req.url} to ${proxyReq.path}`);

    // Set explicit timeout on the outgoing request
    proxyReq.setTimeout(60000, () => {
      logger.error('Proxy request timeout');
      proxyReq.destroy();
    });

    // Forward user info from JWT
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
      proxyReq.setHeader('X-User-Email', req.user.email);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  },
  onProxyRes: (proxyRes, req, res) => {
    logger.info(`Proxy response: ${proxyRes.statusCode} for ${req.method} ${req.url}`);
  }
};

// Auth routes (public)
app.use('/api/auth', createProxyMiddleware({
  target: AUTH_SERVICE,
  ...proxyOptions
}));

// Product routes (public for reading, protected for writing)
app.use('/api/products', circuitBreaker('products'), createProxyMiddleware({
  target: PRODUCT_SERVICE,
  ...proxyOptions
}));

// Cart routes (protected)
app.use('/api/cart', authMiddleware, circuitBreaker('cart'), createProxyMiddleware({
  target: CART_SERVICE,
  ...proxyOptions
}));

// Order routes (protected)
app.use('/api/orders', authMiddleware, circuitBreaker('orders'), createProxyMiddleware({
  target: ORDER_SERVICE,
  ...proxyOptions
}));

// Notification routes (internal only - optional protection)
app.use('/api/notifications', circuitBreaker('notifications'), createProxyMiddleware({
  target: NOTIFICATION_SERVICE,
  ...proxyOptions
}));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Gateway error:', err);
  res.status(500).json({
    error: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { message: err.message })
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info('Service Routes:');
  logger.info(`  - Auth: ${AUTH_SERVICE}`);
  logger.info(`  - Products: ${PRODUCT_SERVICE}`);
  logger.info(`  - Cart: ${CART_SERVICE}`);
  logger.info(`  - Orders: ${ORDER_SERVICE}`);
  logger.info(`  - Notifications: ${NOTIFICATION_SERVICE}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

module.exports = app;
