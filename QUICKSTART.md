# Quick Start Guide

Get the e-commerce platform running in under 5 minutes!

## Prerequisites

- Docker & Docker Compose installed
- 8GB RAM available
- Ports available: 3000, 4000, 5000-5004, 5601, 9090, 9200, 3001

## 🚀 Start Everything

```bash
# 1. Clone the repository
git clone <repository-url>
cd ecommerce_demo

# 2. Create environment file
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Wait for services to be healthy (1-2 minutes)
docker-compose ps

# 5. Seed sample data
./scripts/seed-data.sh
```

## 🎯 Access the Platform

### Main Services
- **API Gateway**: http://localhost:4000
- **API Documentation**: See [docs/api.md](docs/api.md)

### Individual Services (if needed)
- Auth Service: http://localhost:5000
- Product Catalog: http://localhost:5001
- Cart Service: http://localhost:5002
- Order Service: http://localhost:5003
- Notification Service: http://localhost:5004

### Monitoring
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601

## 🧪 Test the API

### 1. Register a user
```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'
```

Save the `accessToken` from the response.

### 2. Browse products
```bash
curl http://localhost:4000/api/products
```

### 3. Add to cart
```bash
curl -X POST http://localhost:4000/api/cart/items \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"productId": 1, "quantity": 2}'
```

### 4. Create order
```bash
curl -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "shippingAddress": "123 Main St, City, State, ZIP"
  }'
```

## 📊 View Metrics

Open Grafana (http://localhost:3001):
1. Login with admin/admin
2. Navigate to Dashboards
3. Explore Prometheus data source

## 🛑 Stop Services

```bash
# Stop all services
docker-compose down

# Remove all data (clean slate)
docker-compose down -v
```

## 🐛 Troubleshooting

### Services not starting?
```bash
# Check logs
docker-compose logs -f

# Check specific service
docker-compose logs -f api-gateway
```

### Port conflicts?
Edit `docker-compose.yml` to change port mappings.

### Database not connecting?
```bash
# Restart database
docker-compose restart postgres

# Check if it's healthy
docker-compose ps postgres
```

## 📚 Next Steps

1. **Read the docs**: See [README.md](README.md) for full documentation
2. **Explore the architecture**: [docs/architecture.md](docs/architecture.md)
3. **Deploy to Kubernetes**: [docs/deployment.md](docs/deployment.md)
4. **Set up the frontend**: [docs/frontend-setup.md](docs/frontend-setup.md)
5. **DevOps practices**: [docs/devops.md](docs/devops.md)

## 💡 Tips

- All services have `/health` and `/metrics` endpoints
- Default password for Grafana is `admin`
- JWT tokens expire in 15 minutes
- Check `docker-compose logs` for any issues
- Use `./scripts/seed-data.sh` to populate sample products

## 🎯 For Hackathon Judges

This platform demonstrates:
- ✅ Microservices architecture
- ✅ Containerization (Docker)
- ✅ Orchestration (Docker Compose + Kubernetes)
- ✅ CI/CD (GitHub Actions)
- ✅ Monitoring (Prometheus + Grafana)
- ✅ Logging (ELK Stack)
- ✅ API Gateway pattern
- ✅ Health checks & resilience
- ✅ Auto-scaling (HPA)
- ✅ Infrastructure as Code

**See full DevOps features**: [docs/devops.md](docs/devops.md)

## 📞 Need Help?

Check the comprehensive docs:
- [README.md](README.md) - Overview
- [docs/architecture.md](docs/architecture.md) - System design
- [docs/api.md](docs/api.md) - API reference
- [docs/deployment.md](docs/deployment.md) - Deployment guide
- [docs/devops.md](docs/devops.md) - DevOps practices
