#!/bin/bash

set -e

echo "☸️ Deploying to Kubernetes..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed"
    exit 1
fi

# Check cluster connection
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ Cannot connect to Kubernetes cluster"
    exit 1
fi

echo "✓ Connected to Kubernetes cluster"
echo ""

# Apply secrets and configmaps
echo "📝 Applying ConfigMaps and Secrets..."
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/

# Deploy infrastructure
echo "🗄️ Deploying infrastructure (PostgreSQL, Redis)..."
kubectl apply -f k8s/deployments/postgres.yaml
kubectl apply -f k8s/deployments/redis.yaml

echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s || true
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s || true

# Deploy microservices
echo "🚀 Deploying microservices..."
kubectl apply -f k8s/deployments/auth-service.yaml
kubectl apply -f k8s/deployments/product-catalog.yaml
kubectl apply -f k8s/deployments/cart-service.yaml
kubectl apply -f k8s/deployments/order-service.yaml
kubectl apply -f k8s/deployments/notification-service.yaml
kubectl apply -f k8s/deployments/api-gateway.yaml

# Deploy monitoring
echo "📊 Deploying monitoring stack..."
kubectl apply -f k8s/monitoring/

echo ""
echo "✓ Deployment complete!"
echo ""
echo "Checking pod status..."
kubectl get pods

echo ""
echo "Services:"
kubectl get svc

echo ""
echo "To access the API Gateway:"
echo "  kubectl port-forward svc/api-gateway 4000:4000"
echo ""
echo "To access Grafana:"
echo "  kubectl port-forward svc/grafana 3000:3000"
