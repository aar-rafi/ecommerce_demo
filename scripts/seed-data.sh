#!/bin/bash

# Script to seed initial data into the platform
# Improved version with health checks and retries

API_URL="${API_URL:-http://localhost:4000}"
MAX_RETRIES=30
RETRY_INTERVAL=2

echo "🌱 Seeding data to $API_URL..."
echo ""

# Function to check if service is ready
check_health() {
    local url=$1
    local service_name=$2
    local retries=0

    echo "⏳ Waiting for $service_name to be ready..."

    while [ $retries -lt $MAX_RETRIES ]; do
        if curl -sf "$url/health" > /dev/null 2>&1; then
            echo "✅ $service_name is ready!"
            return 0
        fi

        retries=$((retries + 1))
        if [ $retries -lt $MAX_RETRIES ]; then
            echo "   Attempt $retries/$MAX_RETRIES - waiting ${RETRY_INTERVAL}s..."
            sleep $RETRY_INTERVAL
        fi
    done

    echo "❌ $service_name failed to become ready after $MAX_RETRIES attempts"
    return 1
}

# Check if API Gateway is ready
if ! check_health "$API_URL" "API Gateway"; then
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check if services are running: docker compose ps"
    echo "2. Check logs: docker compose logs api-gateway"
    echo "3. Wait a bit longer - first startup can take 2-3 minutes"
    exit 1
fi

# Check if Auth Service is ready (via gateway)
echo ""
echo "⏳ Checking Auth Service..."
AUTH_HEALTH=$(curl -sf "$API_URL/api/auth/login" 2>&1 || echo "not ready")
if [[ "$AUTH_HEALTH" == *"not ready"* ]] || [[ "$AUTH_HEALTH" == "" ]]; then
    echo "⚠️  Auth service might not be ready yet, but continuing..."
fi

# Register a test user
echo ""
echo "👤 Creating test user..."

USER_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }')

# Extract HTTP code
HTTP_CODE=$(echo "$USER_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$USER_RESPONSE" | sed '/HTTP_CODE:/d')

echo "Response code: $HTTP_CODE"

# Check for success (201 or 409 if user already exists)
if [ "$HTTP_CODE" = "201" ]; then
    echo "✅ User created successfully"
elif [ "$HTTP_CODE" = "409" ]; then
    echo "⚠️  User already exists - continuing with existing user..."
    echo ""
    echo "👤 Logging in with existing user..."

    USER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "test@example.com",
        "password": "password123"
      }')
else
    echo "❌ Failed to register user"
    echo "Response: $RESPONSE_BODY"
    echo ""
    echo "Debug steps:"
    echo "1. Check auth-service logs: docker compose logs auth-service"
    echo "2. Check database logs: docker compose logs postgres"
    echo "3. Try manually: curl http://localhost:5000/health"
    exit 1
fi

# Extract token (works with both jq and grep)
if command -v jq &> /dev/null; then
    TOKEN=$(echo "$USER_RESPONSE" | jq -r '.tokens.accessToken // empty')
else
    TOKEN=$(echo "$USER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get access token"
    echo "Response: $USER_RESPONSE"
    exit 1
fi

echo "✅ Got access token (${#TOKEN} chars)"

# Create sample products
echo ""
echo "📦 Creating sample products..."

PRODUCTS=(
    '{"name":"Laptop","description":"High-performance laptop","price":999.99,"category":"Electronics","stock_quantity":50,"sku":"LAPTOP-001","image_url":"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"}'
    '{"name":"Smartphone","description":"Latest smartphone model","price":699.99,"category":"Electronics","stock_quantity":100,"sku":"PHONE-001","image_url":"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"}'
    '{"name":"Headphones","description":"Wireless noise-canceling headphones","price":299.99,"category":"Electronics","stock_quantity":75,"sku":"HEADPH-001","image_url":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"}'
    '{"name":"Running Shoes","description":"Comfortable running shoes","price":89.99,"category":"Sports","stock_quantity":120,"sku":"SHOES-001","image_url":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"}'
    '{"name":"Coffee Maker","description":"Automatic coffee maker","price":79.99,"category":"Home","stock_quantity":60,"sku":"COFFEE-001","image_url":"https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400"}'
)

for product in "${PRODUCTS[@]}"; do
    RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL/api/products" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$product")

    HTTP_CODE=$(echo "$RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)

    if [ "$HTTP_CODE" = "201" ]; then
        echo "✅ Product created"
    else
        echo "⚠️  Product creation returned code $HTTP_CODE (might already exist)"
    fi
done

echo ""
echo "🎉 Data seeding complete!"
echo ""
echo "📝 Test credentials:"
echo "  Email: test@example.com"
echo "  Password: password123"
echo ""
echo "🔗 Quick test:"
echo "  curl http://localhost:4000/api/products"
echo ""
