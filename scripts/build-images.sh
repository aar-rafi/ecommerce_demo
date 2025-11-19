#!/bin/bash

set -e

echo "🐳 Building Docker images for all services..."

SERVICES=(
    "auth-service"
    "product-catalog"
    "cart-service"
    "order-service"
    "notification-service"
    "api-gateway"
)

for service in "${SERVICES[@]}"; do
    echo "Building $service..."
    docker build -t "$service:latest" "./services/$service"
done

echo "✓ All Docker images built successfully!"
echo ""
echo "Built images:"
docker images | grep -E "auth-service|product-catalog|cart-service|order-service|notification-service|api-gateway"
