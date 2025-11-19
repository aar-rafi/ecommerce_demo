#!/bin/bash

echo "🛑 Stopping all services..."

# Kill background processes
pkill -f "npm run dev" || true
pkill -f "uvicorn main:app" || true

# Stop Docker containers
docker-compose down

echo "✓ All services stopped"
