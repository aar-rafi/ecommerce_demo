#!/bin/bash

# Load testing script to generate traffic for monitoring

API_URL="${API_URL:-http://localhost:4000}"
DURATION=${DURATION:-60}  # seconds
CONCURRENT=${CONCURRENT:-10}

echo "🔥 Load Testing E-Commerce Platform"
echo "=================================="
echo "API URL: $API_URL"
echo "Duration: ${DURATION}s"
echo "Concurrent requests: $CONCURRENT"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to make requests
make_requests() {
    local endpoint=$1
    local method=${2:-GET}
    local data=$3
    local token=$4

    while true; do
        if [ -n "$data" ]; then
            curl -s -X $method "$API_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" > /dev/null
        else
            curl -s "$API_URL$endpoint" > /dev/null
        fi
        sleep 0.1  # 10 requests per second per worker
    done
}

# Register a test user and get token
echo "📝 Setting up test user..."
USER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "loadtest@example.com",
    "password": "password123",
    "first_name": "Load",
    "last_name": "Test"
  }')

# If user exists, login
if echo "$USER_RESPONSE" | grep -q "already"; then
    echo "User exists, logging in..."
    USER_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
      -H "Content-Type: application/json" \
      -d '{
        "email": "loadtest@example.com",
        "password": "password123"
      }')
fi

# Extract token
TOKEN=$(echo "$USER_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Failed to get token. Make sure services are running."
    exit 1
fi

echo "✅ Got authentication token"
echo ""
echo "🚀 Starting load test for ${DURATION} seconds..."
echo ""

# Start background workers
PIDS=()

# Worker 1-3: Browse products (read-heavy)
for i in {1..3}; do
    make_requests "/api/products" GET "" "$TOKEN" &
    PIDS+=($!)
done
echo -e "${BLUE}▶${NC} Started 3 workers: Browse products"

# Worker 4-5: Get specific products
for i in {1..2}; do
    for product_id in {1..5}; do
        curl -s "$API_URL/api/products/$product_id" > /dev/null &
    done
    sleep 0.5
done &
PIDS+=($!)
echo -e "${BLUE}▶${NC} Started 2 workers: View product details"

# Worker 6-7: Add to cart
for i in {1..2}; do
    (
        while true; do
            PRODUCT_ID=$((RANDOM % 5 + 1))
            curl -s -X POST "$API_URL/api/cart/items" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "{\"productId\": $PRODUCT_ID, \"quantity\": 1}" > /dev/null
            sleep 0.5
        done
    ) &
    PIDS+=($!)
done
echo -e "${BLUE}▶${NC} Started 2 workers: Add to cart"

# Worker 8: View cart
make_requests "/api/cart" GET "" "$TOKEN" &
PIDS+=($!)
echo -e "${BLUE}▶${NC} Started 1 worker: View cart"

# Worker 9: Create orders (occasionally)
(
    while true; do
        curl -s -X POST "$API_URL/api/orders" \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer $TOKEN" \
            -d '{"userId": 1, "shippingAddress": "123 Test St"}' > /dev/null
        sleep 2
    done
) &
PIDS+=($!)
echo -e "${BLUE}▶${NC} Started 1 worker: Create orders"

# Worker 10: Health checks
make_requests "/health" GET "" "" &
PIDS+=($!)
echo -e "${BLUE}▶${NC} Started 1 worker: Health checks"

echo ""
echo "⏱️  Running for ${DURATION} seconds..."
echo "📊 View metrics at:"
echo "   - Prometheus: http://localhost:9090"
echo "   - Grafana: http://localhost:3001"
echo ""

# Progress bar
for ((i=1; i<=DURATION; i++)); do
    PERCENT=$((i * 100 / DURATION))
    BAR=$(printf "%-50s" "$(printf '#%.0s' $(seq 1 $((PERCENT / 2))))")
    printf "\r[${BAR}] ${PERCENT}%% (${i}/${DURATION}s)"
    sleep 1
done

echo ""
echo ""
echo "🛑 Stopping load test..."

# Kill all background workers
for pid in "${PIDS[@]}"; do
    kill $pid 2>/dev/null
done

# Kill any remaining curl processes
pkill -f "curl.*$API_URL" 2>/dev/null

echo "✅ Load test complete!"
echo ""
echo "📊 Check your metrics now:"
echo "   Prometheus: http://localhost:9090/graph"
echo "   Grafana: http://localhost:3001"
echo ""
echo "Try these Prometheus queries:"
echo "  - sum(rate(http_requests_total[1m]))"
echo "  - histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"
echo "  - sum by (service) (rate(http_requests_total[1m]))"
