#!/bin/bash

# Development startup script
# Runs all services in development mode with hot reload

set -e

echo "🚀 Starting E-Commerce Platform in Development Mode"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠ .env file not found. Creating from .env.example...${NC}"
    cp .env.example .env
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed"
    exit 1
fi

if ! command_exists python3; then
    echo "❌ Python 3 is not installed"
    exit 1
fi

if ! command_exists docker; then
    echo "❌ Docker is not installed"
    exit 1
fi

echo -e "${GREEN}✓ All prerequisites met${NC}"

# Start infrastructure with Docker Compose
echo ""
echo "🐳 Starting infrastructure (PostgreSQL, Redis, Monitoring)..."
docker-compose up -d postgres redis prometheus grafana

echo "⏳ Waiting for databases to be ready..."
sleep 10

# Install dependencies
echo ""
echo "📦 Installing dependencies..."

install_node_service() {
    service=$1
    echo "  Installing $service..."
    cd "services/$service"
    npm install --silent
    cd ../..
}

install_python_service() {
    service=$1
    echo "  Installing $service..."
    cd "services/$service"
    pip install -r requirements.txt --quiet
    cd ../..
}

install_node_service "auth-service"
install_node_service "cart-service"
install_node_service "order-service"
install_node_service "api-gateway"
install_python_service "product-catalog"
install_python_service "notification-service"

echo -e "${GREEN}✓ Dependencies installed${NC}"

# Start services
echo ""
echo "🎯 Starting microservices..."
echo "   Press Ctrl+C to stop all services"
echo ""

# Use tmux or screen if available, otherwise use background processes
if command_exists tmux; then
    echo "Using tmux for service management"

    tmux new-session -d -s ecommerce
    tmux split-window -v -t ecommerce
    tmux split-window -h -t ecommerce
    tmux select-pane -t ecommerce:0.0
    tmux split-window -h -t ecommerce

    # Auth Service
    tmux send-keys -t ecommerce:0.0 "cd services/auth-service && npm run dev" C-m
    # Product Catalog
    tmux send-keys -t ecommerce:0.1 "cd services/product-catalog && uvicorn main:app --reload --port 5001" C-m
    # Cart Service
    tmux send-keys -t ecommerce:0.2 "cd services/cart-service && npm run dev" C-m
    # Order Service
    tmux send-keys -t ecommerce:0.3 "cd services/order-service && npm run dev" C-m

    # Create another window for more services
    tmux new-window -t ecommerce
    tmux split-window -h -t ecommerce

    # Notification Service
    tmux send-keys -t ecommerce:1.0 "cd services/notification-service && uvicorn main:app --reload --port 5004" C-m
    # API Gateway
    tmux send-keys -t ecommerce:1.1 "cd services/api-gateway && npm run dev" C-m

    echo -e "${GREEN}✓ Services started in tmux session 'ecommerce'${NC}"
    echo ""
    echo "Commands:"
    echo "  tmux attach -t ecommerce  - Attach to session"
    echo "  tmux kill-session -t ecommerce - Stop all services"

    tmux attach -t ecommerce

else
    echo "Starting services in background..."

    # Start services in background
    cd services/auth-service && npm run dev > ../../logs/auth.log 2>&1 &
    cd ../..

    cd services/product-catalog && uvicorn main:app --reload --port 5001 > ../../logs/products.log 2>&1 &
    cd ../..

    cd services/cart-service && npm run dev > ../../logs/cart.log 2>&1 &
    cd ../..

    cd services/order-service && npm run dev > ../../logs/orders.log 2>&1 &
    cd ../..

    cd services/notification-service && uvicorn main:app --reload --port 5004 > ../../logs/notifications.log 2>&1 &
    cd ../..

    cd services/api-gateway && npm run dev > ../../logs/gateway.log 2>&1 &
    cd ../..

    echo -e "${GREEN}✓ Services started in background${NC}"
    echo ""
    echo "Service URLs:"
    echo "  API Gateway:     http://localhost:4000"
    echo "  Auth Service:    http://localhost:5000"
    echo "  Products:        http://localhost:5001"
    echo "  Cart:            http://localhost:5002"
    echo "  Orders:          http://localhost:5003"
    echo "  Notifications:   http://localhost:5004"
    echo ""
    echo "Monitoring:"
    echo "  Prometheus:      http://localhost:9090"
    echo "  Grafana:         http://localhost:3001"
    echo ""
    echo "Logs are in ./logs/ directory"
    echo "Run './scripts/stop-dev.sh' to stop all services"

    # Wait for interrupt
    trap "echo 'Stopping services...'; ./scripts/stop-dev.sh" INT
    wait
fi
