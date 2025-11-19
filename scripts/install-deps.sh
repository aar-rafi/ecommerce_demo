#!/bin/bash

set -e

echo "📦 Installing dependencies for all services..."

# Node.js services
for service in auth-service cart-service order-service api-gateway; do
    echo "Installing $service..."
    cd "services/$service"
    npm install
    cd ../..
done

# Python services
for service in product-catalog notification-service; do
    echo "Installing $service..."
    cd "services/$service"
    pip install -r requirements.txt
    cd ../..
done

echo "✓ All dependencies installed successfully!"
