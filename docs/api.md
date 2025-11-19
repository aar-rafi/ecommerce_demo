# API Documentation

Base URL: `http://localhost:4000` (via API Gateway)

## Authentication

Most endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Auth Service

### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response** (201):
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response** (200):
```json
{
  "message": "Login successful",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer"
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "customer",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "..."
}
```

### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

## Product Catalog

### List Products
```http
GET /api/products?skip=0&limit=50&category=Electronics&search=laptop
```

**Query Parameters**:
- `skip` (number): Pagination offset (default: 0)
- `limit` (number): Results per page (default: 50, max: 100)
- `category` (string): Filter by category
- `search` (string): Search in name, description, SKU

**Response** (200):
```json
[
  {
    "id": 1,
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "category": "Electronics",
    "stock_quantity": 50,
    "sku": "LAPTOP-001",
    "image_url": "https://...",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Product
```http
GET /api/products/:id
```

**Response** (200):
```json
{
  "id": 1,
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "category": "Electronics",
  "stock_quantity": 50,
  "sku": "LAPTOP-001",
  "image_url": "https://...",
  "is_active": true,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### Create Product (Admin)
```http
POST /api/products
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "category": "Electronics",
  "stock_quantity": 50,
  "sku": "LAPTOP-001",
  "image_url": "https://...",
  "is_active": true
}
```

**Response** (201):
```json
{
  "id": 1,
  "name": "Laptop",
  ...
}
```

### Update Product (Admin)
```http
PUT /api/products/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "price": 899.99,
  "stock_quantity": 45
}
```

### Delete Product (Admin)
```http
DELETE /api/products/:id
Authorization: Bearer <admin_token>
```

**Response** (204): No content

## Cart Service

### Get Cart
```http
GET /api/cart
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "items": [
    {
      "productId": 1,
      "quantity": 2,
      "product": {
        "id": 1,
        "name": "Laptop",
        "price": 999.99,
        "image_url": "https://..."
      },
      "subtotal": 1999.98
    }
  ],
  "total": 1999.98,
  "itemCount": 1
}
```

### Add Item to Cart
```http
POST /api/cart/items
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

**Response** (201):
```json
{
  "items": [...],
  "total": 1999.98,
  "itemCount": 1
}
```

### Update Cart Item
```http
PUT /api/cart/items/:productId
Authorization: Bearer <token>
Content-Type: application/json

{
  "quantity": 3
}
```

**Note**: Set `quantity: 0` to remove item.

### Remove Item from Cart
```http
DELETE /api/cart/items/:productId
Authorization: Bearer <token>
```

### Clear Cart
```http
DELETE /api/cart
Authorization: Bearer <token>
```

## Order Service

### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 1,
  "shippingAddress": "123 Main St, City, State, ZIP"
}
```

**Response** (201):
```json
{
  "order": {
    "id": 1,
    "userId": 1,
    "totalAmount": 1999.98,
    "status": "pending",
    "shippingAddress": "123 Main St, City, State, ZIP",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Get User Orders
```http
GET /api/orders?userId=1
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "orders": [
    {
      "id": 1,
      "user_id": 1,
      "total_amount": "1999.98",
      "status": "pending",
      "shipping_address": "123 Main St, City, State, ZIP",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### Get Order Details
```http
GET /api/orders/:id
Authorization: Bearer <token>
```

**Response** (200):
```json
{
  "order": {
    "id": 1,
    "userId": 1,
    "totalAmount": 1999.98,
    "status": "pending",
    "shippingAddress": "123 Main St, City, State, ZIP",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "items": [
      {
        "productId": 1,
        "productName": "Laptop",
        "quantity": 2,
        "price": 999.99,
        "subtotal": 1999.98
      }
    ]
  }
}
```

### Update Order Status (Admin)
```http
PATCH /api/orders/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "shipped"
}
```

**Valid Statuses**: `pending`, `processing`, `shipped`, `delivered`, `cancelled`

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation error",
  "details": "..."
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "error": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

### 503 Service Unavailable
```json
{
  "error": "Service temporarily unavailable",
  "message": "The requested service is not responding"
}
```

## Rate Limits

- **API Gateway**: 1000 requests per 15 minutes per IP
- **Individual Services**: 100-200 requests per 15 minutes per IP

## Example Usage

### Complete Flow: Register → Browse → Add to Cart → Checkout

```bash
# 1. Register
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }'

# Save the access token
TOKEN="<access_token_from_response>"

# 2. Browse products
curl http://localhost:4000/api/products

# 3. Add to cart
curl -X POST http://localhost:4000/api/cart/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 2
  }'

# 4. View cart
curl http://localhost:4000/api/cart \
  -H "Authorization: Bearer $TOKEN"

# 5. Create order
curl -X POST http://localhost:4000/api/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "shippingAddress": "123 Main St, City, State, ZIP"
  }'

# 6. View orders
curl "http://localhost:4000/api/orders?userId=1" \
  -H "Authorization: Bearer $TOKEN"
```

## WebSocket Support (Future)

Real-time order updates via WebSocket:
```javascript
const ws = new WebSocket('ws://localhost:4000/orders/updates');
ws.onmessage = (event) => {
  console.log('Order update:', JSON.parse(event.data));
};
```

## Versioning

Currently: v1 (implicit)
Future: `/api/v2/...`

## Pagination

For list endpoints:
```
GET /api/products?skip=0&limit=50
```

Response headers (future):
```
X-Total-Count: 150
X-Page-Size: 50
X-Page-Number: 1
Link: <...>; rel="next"
```
