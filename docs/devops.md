# DevOps Guide

## Introduction

This guide explains the DevOps practices, tools, and workflows implemented in this e-commerce platform. It's designed to showcase modern DevOps methodologies suitable for a hackathon or real-world production environment.

## DevOps Highlights

### 1. Containerization with Docker

#### Why Docker?
- **Consistency**: Same environment dev → staging → production
- **Isolation**: Services run independently
- **Portability**: Deploy anywhere Docker runs
- **Efficiency**: Lightweight compared to VMs

#### Multi-Stage Builds
All services use multi-stage Dockerfiles:

```dockerfile
# Build stage - install dependencies
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Production stage - minimal image
FROM node:18-alpine
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
USER nodejs
EXPOSE 5000
CMD ["node", "src/index.js"]
```

**Benefits**:
- Smaller final image (no build tools)
- Security: non-root user
- Layer caching for faster builds

#### Health Checks in Dockerfile
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
```

### 2. Orchestration

#### Docker Compose (Development)
- Quick local setup
- Service dependencies
- Volume management
- Network isolation

```yaml
version: '3.8'
services:
  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
    ...
  auth-service:
    depends_on:
      postgres:
        condition: service_healthy
```

**Key Features**:
- Health check dependencies
- Environment variable management
- Persistent volumes for data
- Integrated monitoring stack

#### Kubernetes (Production)
**Deployments**:
- Rolling updates (zero-downtime)
- Replica sets for availability
- Resource limits/requests
- Liveness & readiness probes

**Auto-Scaling** (HPA):
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-gateway-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: api-gateway
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 60
```

**Key Features**:
- CPU and memory-based scaling
- Custom metrics support
- Predictive scaling capabilities

### 3. CI/CD Pipeline

#### GitHub Actions Workflow

**On Pull Request**:
1. Lint code
2. Run tests
3. Build Docker images (test)
4. Run integration tests
5. Security scan

**On Push to `develop`**:
1. All PR checks
2. Build & push to registry
3. Deploy to staging
4. Run smoke tests

**On Push to `main`**:
1. All PR checks
2. Security scan
3. Build & tag images
4. Deploy to production
5. Run health checks
6. Send notifications

#### Pipeline Features

**Parallel Execution**:
```yaml
strategy:
  matrix:
    service:
      - auth-service
      - product-catalog
      - cart-service
```
Tests run in parallel for all services.

**Caching**:
```yaml
cache: 'npm'
cache-dependency-path: services/${{ matrix.service }}/package-lock.json
```
Faster builds with dependency caching.

**Security Scanning**:
```yaml
- uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.REGISTRY }}/${{ service }}:${{ github.sha }}
    format: 'sarif'
```
Automatic vulnerability scanning with Trivy.

**Environment Protection**:
```yaml
environment:
  name: production
  url: https://example.com
```
Manual approval gates for production.

### 4. Monitoring & Observability

#### Prometheus (Metrics)

**What We Monitor**:
- HTTP request duration (histogram)
- HTTP request count (counter)
- Error rates
- Service-specific metrics (orders created, etc.)
- System metrics (CPU, memory, disk)

**Scrape Configuration**:
```yaml
scrape_configs:
  - job_name: 'api-gateway'
    metrics_path: '/metrics'
    static_configs:
      - targets: ['api-gateway:4000']
```

**Example Metrics**:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/api/products",status_code="200",service="api-gateway"} 1523

# HELP http_request_duration_seconds Duration of HTTP requests
# TYPE http_request_duration_seconds histogram
http_request_duration_seconds_bucket{method="GET",route="/api/products",le="0.1"} 1234
```

#### Grafana (Visualization)

**Dashboards** (can be created):
1. **System Overview**: All services health, request rates, errors
2. **Service Details**: Per-service metrics, latency percentiles
3. **Database Performance**: Query times, connections, slow queries
4. **Business Metrics**: Orders/hour, revenue, active users

**Alerting Rules** (example):
```yaml
- alert: HighErrorRate
  expr: rate(http_requests_total{status_code=~"5.."}[5m]) > 0.05
  for: 5m
  labels:
    severity: critical
  annotations:
    summary: "High error rate detected"
```

#### Logging (ELK Stack)

**Elasticsearch**: Log storage and indexing
**Logstash**: Log aggregation and processing (future)
**Kibana**: Log visualization and search

**Structured Logging** (all services):
```javascript
logger.info('Order created', {
  orderId: order.id,
  userId: user.id,
  amount: order.total,
  timestamp: new Date().toISOString()
});
```

**Benefits**:
- Easy to search and filter
- Correlation IDs for tracing
- JSON format for parsing

### 5. Resilience & Reliability

#### Circuit Breaker Pattern

Prevents cascading failures:
```javascript
class CircuitBreaker {
  states: CLOSED → OPEN → HALF_OPEN

  CLOSED: Normal operation
  OPEN: Reject requests, return error
  HALF_OPEN: Test if service recovered
}
```

**Configuration**:
- Failure threshold: 5 consecutive errors
- Reset timeout: 60 seconds
- Applies to: Product, Cart, Order, Notification services

#### Health Checks

**Liveness Probe** (`/health`):
- Is the service running?
- Returns 200 OK if process is alive
- K8s restarts pod if fails

**Readiness Probe** (`/ready`):
- Can the service handle requests?
- Checks database connectivity
- K8s removes from load balancer if fails

**Example**:
```javascript
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready' });
  } catch (error) {
    res.status(503).json({ status: 'not ready' });
  }
});
```

#### Rate Limiting

**API Gateway**: 1000 requests per 15 minutes per IP
**Services**: 100-200 requests per 15 minutes per IP

Prevents:
- DDoS attacks
- Resource exhaustion
- Cost overruns

#### Graceful Shutdown

All services handle SIGTERM:
```javascript
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  // Close database connections
  pool.end(() => {
    logger.info('Database closed');
    process.exit(0);
  });
});
```

### 6. Security Best Practices

#### Container Security
- ✅ Non-root user in containers
- ✅ Multi-stage builds (smaller attack surface)
- ✅ Minimal base images (alpine)
- ✅ No secrets in images
- ✅ Vulnerability scanning (Trivy)

#### Application Security
- ✅ Input validation (Joi, Pydantic)
- ✅ SQL injection prevention
- ✅ XSS protection (Helmet.js)
- ✅ CORS configuration
- ✅ Rate limiting
- ✅ JWT token expiry

#### Secret Management
- ✅ Environment variables
- ✅ Kubernetes Secrets (base64)
- 🔄 External secret managers (future)

#### Network Security
- ✅ Service-to-service encryption (TLS in prod)
- ✅ Network policies (K8s, future)
- ✅ API authentication

### 7. Infrastructure as Code

#### Kubernetes Manifests
All infrastructure defined as code:
- Deployments
- Services
- ConfigMaps
- Secrets
- PersistentVolumeClaims
- HorizontalPodAutoscalers

**Benefits**:
- Version controlled
- Reproducible
- Self-documenting
- Easy to review (PR)

#### GitOps Workflow (Future)
```
Git Push → CI/CD → Update K8s Manifests → ArgoCD → Deploy
```

### 8. Performance Optimization

#### Database
- Connection pooling (20 connections)
- Indexed queries
- Prepared statements

#### Caching
- Redis for cart data
- HTTP caching headers (future)
- CDN for static assets (future)

#### Load Balancing
- Kubernetes Service (round-robin)
- API Gateway (proxy)
- Multiple replicas per service

### 9. Disaster Recovery

#### Backup Strategy
- Database: Automated daily backups
- Configuration: Git repository
- Secrets: External secret manager

#### Recovery Procedures
1. Database restore from backup
2. Redeploy from Git
3. Restore secrets
4. Run health checks

#### High Availability
- Multiple replicas (2-3 minimum)
- Multi-zone deployment (K8s)
- Database replication (future)

## Development Workflow

### Local Development
```bash
# 1. Clone repo
git clone <repo-url>

# 2. Install dependencies
./scripts/install-deps.sh

# 3. Start infrastructure
docker-compose up -d postgres redis

# 4. Start services
./scripts/dev.sh
```

### Feature Development
```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# 3. Test locally

# 4. Commit and push
git add .
git commit -m "Add new feature"
git push origin feature/new-feature

# 5. Create PR
# GitHub Actions runs tests automatically

# 6. Merge to develop
# Auto-deploys to staging

# 7. Merge to main
# Manual approval → production deployment
```

### Testing Strategy
- **Unit Tests**: Individual functions
- **Integration Tests**: Service APIs
- **Contract Tests**: Service-to-service (future)
- **E2E Tests**: Full user flows (future)

## Deployment Strategies

### Rolling Update (Default)
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```
- Zero downtime
- Gradual rollout
- Easy rollback

### Blue-Green Deployment (Future)
- Two identical environments
- Switch traffic instantly
- Easy rollback

### Canary Deployment (Future)
- Deploy to small subset (10%)
- Monitor metrics
- Gradually increase traffic

## Monitoring Checklist

✅ Service health endpoints
✅ Metrics collection (Prometheus)
✅ Visualization (Grafana)
✅ Log aggregation (ELK)
✅ Error tracking
✅ Performance monitoring
🔄 Alerting rules
🔄 On-call rotation
🔄 Incident response plan

## Production Readiness Checklist

✅ Containerized services
✅ Health checks
✅ Resource limits
✅ Auto-scaling
✅ Load balancing
✅ Monitoring & alerting
✅ Structured logging
✅ Secret management
✅ CI/CD pipeline
✅ Security scanning
🔄 Backup & recovery
🔄 Disaster recovery plan
🔄 Performance testing
🔄 Chaos engineering

## Cost Optimization

### Strategies
1. **Right-sizing**: Match resources to actual usage
2. **Auto-scaling**: Scale down during low traffic
3. **Spot instances**: Use for non-critical workloads
4. **Resource requests**: Set accurate limits
5. **Image optimization**: Smaller images = faster pulls

### Monitoring Costs
- Set up billing alerts
- Track resource usage per service
- Identify optimization opportunities

## Best Practices Summary

1. **Automate Everything**: CI/CD, deployments, testing
2. **Monitor Everything**: Metrics, logs, traces
3. **Secure Everything**: Scanning, secrets, network policies
4. **Document Everything**: Code, architecture, runbooks
5. **Test Everything**: Unit, integration, E2E
6. **Version Everything**: Code, config, infrastructure

## Troubleshooting Guide

### Service Not Starting
```bash
# Check logs
kubectl logs <pod-name>

# Check events
kubectl describe pod <pod-name>

# Check resource limits
kubectl top pod <pod-name>
```

### High Latency
1. Check Prometheus metrics
2. Look for database slow queries
3. Check network latency
4. Review circuit breaker status

### Database Issues
1. Check connections: `kubectl exec -it postgres -- psql -U postgres -c "SELECT count(*) FROM pg_stat_activity;"`
2. Check slow queries
3. Verify indexes exist

## Conclusion

This platform demonstrates production-ready DevOps practices:
- Automated CI/CD pipeline
- Comprehensive monitoring
- High availability
- Security best practices
- Infrastructure as Code
- Resilience patterns

Perfect for demonstrating DevOps skills in a hackathon or real-world scenario.
