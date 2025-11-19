# E-Commerce Platform Architecture

## Overview

This document describes the architecture of the microservices-based e-commerce platform designed for DevOps demonstrations.

## Architecture Principles

### 1. Microservices Architecture
- **Independent Services**: Each service owns its domain and data
- **Technology Diversity**: Mix of Node.js and Python (FastAPI)
- **Loose Coupling**: Services communicate via HTTP APIs
- **High Cohesion**: Each service has a single, well-defined responsibility

### 2. Domain-Driven Design
Services are organized around business capabilities:
- **Auth Service**: User authentication and authorization
- **Product Catalog**: Product information management
- **Cart Service**: Shopping cart operations
- **Order Service**: Order processing and management
- **Notification Service**: Email/SMS notifications
- **API Gateway**: Single entry point, routing, and cross-cutting concerns

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Layer                              │
│                   (Web, Mobile, Third-party)                     │
└────────────────────────────┬─────────────────────────────────────┘
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                        API Gateway                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ • Request Routing        • Rate Limiting                 │   │
│  │ • Authentication         • Circuit Breaker               │   │
│  │ • Load Balancing         • Request/Response Logging      │   │
│  └──────────────────────────────────────────────────────────┘   │
└──┬───────────┬───────────┬───────────┬───────────┬──────────────┘
   │           │           │           │           │
   │           │           │           │           │
┌──▼─────┐ ┌──▼─────┐ ┌──▼─────┐ ┌──▼─────┐ ┌───▼──────┐
│ Auth   │ │Product │ │ Cart   │ │ Order  │ │Notifica- │
│Service │ │Catalog │ │Service │ │Service │ │tion      │
│        │ │        │ │        │ │        │ │Service   │
│Node.js │ │FastAPI │ │Node.js │ │Node.js │ │FastAPI   │
└───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └────────┬─┘
    │          │          │          │               │
┌───▼──────────▼──────────▼──────────▼───────────────┘
│              Data Layer                              │
│  ┌──────────────────┐      ┌──────────────────┐    │
│  │   PostgreSQL     │      │      Redis       │    │
│  │  (Auth, Products │      │  (Cart, Session) │    │
│  │     Orders)      │      │                  │    │
│  └──────────────────┘      └──────────────────┘    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│            Observability & Monitoring                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │Prometheus│  │ Grafana  │  │  ELK Stack       │ │
│  │ (Metrics)│  │(Visualiz)│  │  (Logs)          │ │
│  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Service Breakdown

### API Gateway (Port 4000)
**Technology**: Node.js, Express
**Responsibilities**:
- Single entry point for all client requests
- Request routing to appropriate microservices
- JWT token validation and authentication
- Rate limiting and DDoS protection
- Circuit breaker pattern implementation
- Request/response logging
- CORS handling

**Key Features**:
- HTTP proxy using http-proxy-middleware
- Circuit breaker for fault tolerance
- Metrics collection for monitoring

### Auth Service (Port 5000)
**Technology**: Node.js, Express, PostgreSQL
**Database**: ecommerce_auth

**Responsibilities**:
- User registration and login
- JWT token generation and validation
- Refresh token management
- Password hashing (bcrypt)
- User profile management

**API Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User authentication
- `POST /api/auth/refresh` - Token refresh
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/logout` - User logout

**Database Schema**:
```sql
users (
  id, email, password_hash, first_name, last_name,
  role, is_active, created_at, updated_at
)

refresh_tokens (
  id, user_id, token, expires_at, created_at
)
```

### Product Catalog Service (Port 5001)
**Technology**: Python, FastAPI, PostgreSQL (async)
**Database**: ecommerce_products

**Responsibilities**:
- Product CRUD operations
- Product search and filtering
- Category management
- Inventory tracking

**API Endpoints**:
- `GET /api/products` - List products (with pagination, search, filtering)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product (admin)
- `DELETE /api/products/:id` - Delete product (admin)

**Database Schema**:
```sql
products (
  id, name, description, price, category,
  stock_quantity, sku, image_url, is_active,
  created_at, updated_at
)
```

**Design Decisions**:
- FastAPI for high-performance async operations
- SQLAlchemy with asyncpg for async database access
- Pydantic models for validation

### Cart Service (Port 5002)
**Technology**: Node.js, Express, Redis
**Storage**: Redis (in-memory)

**Responsibilities**:
- Shopping cart management
- Cart item operations (add, update, remove)
- Cart persistence with TTL (7 days)
- Product price validation via Product Catalog

**API Endpoints**:
- `GET /api/cart` - Get user cart
- `POST /api/cart/items` - Add item to cart
- `PUT /api/cart/items/:id` - Update cart item quantity
- `DELETE /api/cart/items/:id` - Remove item from cart
- `DELETE /api/cart` - Clear cart

**Data Model** (Redis):
```
cart:{userId} -> Hash {
  productId: quantity
}
TTL: 7 days
```

**Design Decisions**:
- Redis for fast, temporary storage
- Service-to-service communication for product validation
- User identification via headers (simplified for demo)

### Order Service (Port 5003)
**Technology**: Node.js, Express, PostgreSQL
**Database**: ecommerce_orders

**Responsibilities**:
- Order creation from cart
- Order history
- Order status management
- Integration with cart and notification services

**API Endpoints**:
- `POST /api/orders` - Create order from cart
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status

**Database Schema**:
```sql
orders (
  id, user_id, total_amount, status,
  shipping_address, created_at, updated_at
)

order_items (
  id, order_id, product_id, product_name,
  quantity, price, subtotal
)
```

**Order Flow**:
1. Fetch cart from Cart Service
2. Validate cart is not empty
3. Create order transaction
4. Insert order and order items
5. Clear user's cart (async)
6. Send notification (async)

### Notification Service (Port 5004)
**Technology**: Python, FastAPI

**Responsibilities**:
- Email notifications (mock)
- SMS notifications (mock)
- Order confirmation emails
- Async notification processing

**API Endpoints**:
- `POST /api/notifications/order-created` - Order confirmation
- `POST /api/notifications/email` - Custom email
- `POST /api/notifications/sms` - SMS notification

**Design Decisions**:
- FastAPI BackgroundTasks for async processing
- Mock implementations (ready for real integrations)
- Decoupled from business logic

## Data Architecture

### Database Strategy
**PostgreSQL** - Separate databases per service:
- `ecommerce_auth` - User and authentication data
- `ecommerce_products` - Product catalog
- `ecommerce_orders` - Order history

**Redis**:
- Shopping cart storage
- Session management (future)
- Caching layer (future)

### Data Consistency
- Each service owns its data
- No direct database access between services
- Eventual consistency for cross-service operations
- Transaction boundaries within single service

## Communication Patterns

### Synchronous Communication
- HTTP REST APIs for request-response patterns
- Used for: Cart → Products, Orders → Cart
- Timeout configuration: 5 seconds
- Retry logic with exponential backoff (future)

### Asynchronous Communication
- Fire-and-forget for notifications
- Background tasks in FastAPI
- Future: Message queue (RabbitMQ/Kafka)

## Resilience Patterns

### Circuit Breaker
Implemented in API Gateway:
- Failure threshold: 5 consecutive failures
- Reset timeout: 60 seconds
- States: CLOSED → OPEN → HALF_OPEN

### Health Checks
All services expose:
- `/health` - Liveness probe (service is running)
- `/ready` - Readiness probe (service can handle requests)

### Rate Limiting
- API Gateway: 1000 req/15min per IP
- Individual services: 100-200 req/15min per IP

## Security

### Authentication & Authorization
- JWT-based authentication
- Token expiry: 15 minutes (access), 7 days (refresh)
- Role-based access control (admin, customer)
- Password hashing: bcrypt with salt

### Network Security
- CORS configuration
- Helmet.js for security headers
- Environment-based secrets
- TLS/SSL in production (via ingress)

### Input Validation
- Joi (Node.js) and Pydantic (FastAPI)
- SQL injection prevention (parameterized queries)
- XSS protection

## Observability

### Metrics (Prometheus)
All services expose `/metrics` endpoint:
- HTTP request duration (histogram)
- HTTP request count (counter)
- Service-specific metrics (orders created, etc.)

### Logging (Structured)
- Winston (Node.js) / Python logging
- JSON format for easy parsing
- Log levels: error, warn, info, debug
- Service name in all logs

### Tracing (Future)
- OpenTelemetry integration planned
- Distributed tracing across services

## Deployment Architecture

### Docker Compose (Development)
- All services in one network
- Volume mounts for databases
- Port mapping for local access

### Kubernetes (Production)
- Deployments with replicas
- Services for internal communication
- Horizontal Pod Autoscalers (HPA)
- Ingress for external access
- ConfigMaps and Secrets for configuration
- Persistent Volumes for databases

### Scaling Strategy
- Stateless services: Horizontal scaling via HPA
- Databases: Vertical scaling, read replicas (future)
- Redis: Cluster mode for high availability (future)

## Technology Choices

### Why Node.js?
- Event-driven, non-blocking I/O
- Large ecosystem (npm)
- Good for I/O-heavy operations
- Team familiarity

### Why FastAPI?
- High performance (Starlette + Pydantic)
- Async/await support
- Automatic API documentation
- Type hints and validation
- Showcase polyglot microservices

### Why PostgreSQL?
- ACID compliance for critical data
- Rich feature set
- Strong community support
- Good performance

### Why Redis?
- In-memory speed for carts
- TTL support for auto-expiry
- Simple key-value operations
- Pub/sub for future features

## Future Enhancements

1. **Message Queue**: RabbitMQ/Kafka for event-driven architecture
2. **Service Mesh**: Istio for advanced traffic management
3. **API Gateway**: Kong or Traefik for advanced features
4. **Caching**: Redis caching layer for products
5. **Search**: Elasticsearch for product search
6. **CDN**: CloudFront for static assets
7. **Monitoring**: Jaeger for distributed tracing
8. **Security**: OAuth2, API keys, rate limiting per user
