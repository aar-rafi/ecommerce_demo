#!/bin/bash

# Script to seed initial data into the platform

set -e

API_URL="${API_URL:-http://localhost:4000}"

echo "🌱 Seeding data to $API_URL..."

# Register a test user
echo "Creating test user..."
USER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "first_name": "Test",
    "last_name": "User"
  }')

echo "User created: $USER_RESPONSE"

# Extract token
TOKEN=$(echo "$USER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get access token"
    exit 1
fi

echo "✓ Got access token"

# Create sample products
echo ""
echo "Creating sample products..."

PRODUCTS=(
    '{"name":"Laptop","description":"High-performance laptop","price":999.99,"category":"Electronics","stock_quantity":50,"sku":"LAPTOP-001","image_url":"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400"}'
    '{"name":"Smartphone","description":"Latest smartphone model","price":699.99,"category":"Electronics","stock_quantity":100,"sku":"PHONE-001","image_url":"https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400"}'
    '{"name":"Headphones","description":"Wireless noise-canceling headphones","price":299.99,"category":"Electronics","stock_quantity":75,"sku":"HEADPH-001","image_url":"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400"}'
    '{"name":"Running Shoes","description":"Comfortable running shoes","price":89.99,"category":"Sports","stock_quantity":120,"sku":"SHOES-001","image_url":"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400"}'
    '{"name":"Coffee Maker","description":"Automatic coffee maker","price":79.99,"category":"Home","stock_quantity":60,"sku":"COFFEE-001","image_url":"https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400"}'
)

for product in "${PRODUCTS[@]}"; do
    curl -s -X POST "$API_URL/api/products" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $TOKEN" \
      -d "$product" > /dev/null
    echo "✓ Product created"
done

echo ""
echo "✅ Data seeding complete!"
echo ""
echo "Test credentials:"
echo "  Email: test@example.com"
echo "  Password: password123"
