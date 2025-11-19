# E-Commerce Microservices Platform

A production-ready, DevOps-focused e-commerce platform built with microservices architecture for local businesses.

## Architecture Overview

This platform demonstrates modern DevOps practices with a microservices architecture, containerization, orchestration, monitoring, and CI/CD automation.

### Services Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                              │
│                  (Next.js + shadcn/ui)                       │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                     API Gateway                              │
│              (Node.js/Express + Redis)                       │
│          Rate Limiting, Auth, Load Balancing                 │
└─────┬──────────┬──────────┬──────────┬──────────────────────┘
      │          │          │          │
┌─────▼──────┐ ┌▼────────┐ ┌▼───────┐ ┌▼──────────────────┐
│   Auth     │ │ Product │ │  Cart  │ │      Order        │
│  Service   │ │ Catalog │ │Service │ │     Service       │
│  (Node.js) │ │(FastAPI)│ │(Node.js│ │    (Node.js)      │
│            │ │         │ │)       │ │                   │
└─────┬──────┘ └──┬──────┘ └──┬─────┘ └──┬────────────────┘
      │           │            │           │
┌─────▼───────────▼────────────▼───────────▼─────┐
│              PostgreSQL Database                │
│         (Separate schemas per service)          │
└─────────────────────────────────────────────────┘

      ┌───────────────┐        ┌──────────────────┐
      │  Redis Cache  │        │   Notification   │
      │   & Session   │        │     Service      │
      └───────────────┘        │    (FastAPI)     │
                               └──────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Observability Stack                       │
│  Prometheus + Grafana + ELK (Elasticsearch/Logstash/Kibana) │
└─────────────────────────────────────────────────────────────┘
```

## Technology Stack

### Backend Services
- **API Gateway**: Node.js, Express, Redis
- **Auth Service**: Node.js, Express, JWT, PostgreSQL
- **Product Catalog**: FastAPI (Python), PostgreSQL
- **Cart Service**: Node.js, Express, Redis
- **Order Service**: Node.js, Express, PostgreSQL
- **Notification Service**: FastAPI (Python)

### Frontend
- **Framework**: Next.js 14 (App Router)
- **UI Components**: shadcn/ui (Tweakcn theme compatible)
- **State Management**: React Query
- **Styling**: Tailwind CSS

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose + Kubernetes
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack
- **Caching**: Redis
- **Database**: PostgreSQL

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for local development)
- kubectl (for Kubernetes deployment)

### Running with Docker Compose

```bash
# Clone the repository
git clone <repository-url>
cd ecommerce_demo

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:3000
- API Gateway: http://localhost:4000
- Grafana: http://localhost:3001
- Kibana: http://localhost:5601
- Prometheus: http://localhost:9090

### Running with Kubernetes

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check pod status
kubectl get pods

# Access services (if using minikube)
minikube service api-gateway
minikube service frontend
```

## Development

### Local Development Setup

```bash
# Install dependencies for all services
./scripts/install-deps.sh

# Start services in development mode
./scripts/dev.sh
```

### Running Individual Services

Each service can be run independently for development:

```bash
# Auth Service
cd services/auth-service
npm install
npm run dev

# Product Catalog
cd services/product-catalog
pip install -r requirements.txt
uvicorn main:app --reload --port 5001
```

## DevOps Features

### 1. Health Checks & Monitoring
- All services expose `/health` and `/metrics` endpoints
- Prometheus scrapes metrics from all services
- Grafana dashboards for visualization
- Liveness and readiness probes in Kubernetes

### 2. Resilience Patterns
- Circuit breakers for external dependencies
- Retry logic with exponential backoff
- Request timeouts
- Rate limiting at API Gateway

### 3. Observability
- Structured logging across all services
- Distributed tracing ready
- Centralized log aggregation with ELK
- Real-time metrics and alerting

### 4. CI/CD Pipeline
- Automated testing on PR
- Docker image building and pushing
- Automated deployment to staging/production
- Security scanning
- Code quality checks

### 5. Scalability
- Horizontal pod autoscaling (HPA) in Kubernetes
- Redis for session management and caching
- Database connection pooling
- Stateless service design

### 6. Security
- JWT-based authentication
- API rate limiting
- CORS configuration
- Environment-based secrets management
- Security headers

## Project Structure

```
ecommerce_demo/
├── services/
│   ├── api-gateway/          # Main entry point, routing
│   ├── auth-service/         # User authentication & authorization
│   ├── product-catalog/      # Product management (FastAPI)
│   ├── cart-service/         # Shopping cart management
│   ├── order-service/        # Order processing
│   └── notification-service/ # Email/SMS notifications (FastAPI)
├── frontend/                 # Next.js application
├── k8s/                      # Kubernetes manifests
│   ├── deployments/
│   ├── services/
│   ├── configmaps/
│   ├── secrets/
│   └── monitoring/
├── docker-compose.yml        # Local development
├── docker-compose.prod.yml   # Production setup
├── .github/
│   └── workflows/            # CI/CD pipelines
├── docs/                     # Detailed documentation
├── scripts/                  # Utility scripts
└── monitoring/              # Grafana dashboards, Prometheus config
```

## Documentation

Detailed documentation is available in the `docs/` directory:

- [Architecture Deep Dive](docs/architecture.md)
- [API Documentation](docs/api.md)
- [DevOps Guide](docs/devops.md)
- [Deployment Guide](docs/deployment.md)
- [Development Guide](docs/development.md)
- [Monitoring & Observability](docs/monitoring.md)

## API Endpoints

### Auth Service
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Product Catalog
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)

### Cart Service
- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item
- `DELETE /api/cart/items/:id` - Remove item from cart

### Order Service
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

## Environment Variables

Create `.env` files for each service. See `.env.example` files in each service directory.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - Secret for JWT tokens
- `NODE_ENV` - Environment (development/production)

## Testing

```bash
# Run all tests
./scripts/test.sh

# Run service-specific tests
cd services/auth-service
npm test

# Run integration tests
./scripts/integration-test.sh
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please open an issue on GitHub.
