const promClient = require('prom-client');

const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'gateway_http_request_duration_seconds',
  help: 'Duration of HTTP requests through gateway',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register]
});

const httpRequestTotal = new promClient.Counter({
  name: 'gateway_http_requests_total',
  help: 'Total HTTP requests through gateway',
  labelNames: ['method', 'route', 'status_code', 'service'],
  registers: [register]
});

const setupMetrics = (app) => {
  app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  });
};

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const service = req.path.split('/')[2] || 'unknown'; // Extract service from path

    httpRequestDuration.labels(
      req.method,
      req.path,
      res.statusCode,
      service
    ).observe(duration);

    httpRequestTotal.labels(
      req.method,
      req.path,
      res.statusCode,
      service
    ).inc();
  });

  next();
};

module.exports = { setupMetrics, metricsMiddleware };
