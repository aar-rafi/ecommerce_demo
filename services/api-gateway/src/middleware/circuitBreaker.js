const { logger } = require('../utils/logger');

// Simple circuit breaker implementation
class CircuitBreaker {
  constructor(name, options = {}) {
    this.name = name;
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000; // 1 minute
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = 0;
    this.nextAttempt = Date.now();
  }

  async execute(req, res, next) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        logger.warn(`Circuit breaker OPEN for ${this.name}, request blocked`);
        return res.status(503).json({
          error: 'Service temporarily unavailable',
          message: `${this.name} service is experiencing issues`
        });
      }
      // Try half-open
      this.state = 'HALF_OPEN';
      logger.info(`Circuit breaker HALF_OPEN for ${this.name}`);
    }

    // Monitor response for failures
    const originalSend = res.send;
    res.send = (data) => {
      if (res.statusCode >= 500) {
        this.recordFailure();
      } else if (this.state === 'HALF_OPEN') {
        this.recordSuccess();
      }
      originalSend.call(res, data);
    };

    next();
  }

  recordFailure() {
    this.failures++;
    logger.warn(`${this.name} failure recorded: ${this.failures}/${this.failureThreshold}`);

    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
      logger.error(`Circuit breaker OPEN for ${this.name}`);
    }
  }

  recordSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
    logger.info(`Circuit breaker CLOSED for ${this.name}`);
  }
}

// Create circuit breakers for each service
const breakers = {
  products: new CircuitBreaker('products'),
  cart: new CircuitBreaker('cart'),
  orders: new CircuitBreaker('orders'),
  notifications: new CircuitBreaker('notifications')
};

const circuitBreaker = (serviceName) => {
  return (req, res, next) => {
    const breaker = breakers[serviceName];
    if (breaker) {
      return breaker.execute(req, res, next);
    }
    next();
  };
};

module.exports = { circuitBreaker };
