#!/bin/bash

set -e

echo "☁️  Deploying to Google Kubernetes Engine (GKE)"
echo ""

# Check if kubectl is configured
if ! kubectl cluster-info &> /dev/null; then
    echo "❌ kubectl is not configured"
    echo ""
    echo "Please run:"
    echo "  gcloud container clusters get-credentials CLUSTER_NAME --zone ZONE"
    exit 1
fi

# Get cluster info
CLUSTER_NAME=$(kubectl config current-context)
echo "✓ Connected to cluster: $CLUSTER_NAME"
echo ""

# Create namespace (optional)
echo "📦 Creating namespace..."
kubectl create namespace ecommerce --dry-run=client -o yaml | kubectl apply -f -

# Apply secrets (you should update these!)
echo "🔐 Applying secrets..."
echo "⚠️  WARNING: Update k8s/secrets/db-secrets.yaml with production values!"
read -p "Press enter to continue..."
kubectl apply -f k8s/secrets/ -n ecommerce

# Apply configmaps
echo "📝 Applying ConfigMaps..."
kubectl apply -f k8s/configmaps/ -n ecommerce

# Deploy PostgreSQL
echo "🗄️  Deploying PostgreSQL..."
kubectl apply -f k8s/deployments/postgres.yaml -n ecommerce

# Deploy Redis
echo "📦 Deploying Redis..."
kubectl apply -f k8s/deployments/redis.yaml -n ecommerce

# Wait for databases
echo "⏳ Waiting for databases to be ready..."
kubectl wait --for=condition=ready pod -l app=postgres -n ecommerce --timeout=300s || echo "PostgreSQL taking longer..."
kubectl wait --for=condition=ready pod -l app=redis -n ecommerce --timeout=300s || echo "Redis taking longer..."

# Deploy microservices
echo ""
echo "🚀 Deploying microservices..."
kubectl apply -f k8s/deployments/auth-service.yaml -n ecommerce
kubectl apply -f k8s/deployments/product-catalog.yaml -n ecommerce
kubectl apply -f k8s/deployments/cart-service.yaml -n ecommerce
kubectl apply -f k8s/deployments/order-service.yaml -n ecommerce
kubectl apply -f k8s/deployments/notification-service.yaml -n ecommerce
kubectl apply -f k8s/deployments/api-gateway.yaml -n ecommerce

# Deploy monitoring
echo "📊 Deploying monitoring..."
kubectl apply -f k8s/monitoring/ -n ecommerce

echo ""
echo "⏳ Waiting for deployments to be ready..."
kubectl rollout status deployment/api-gateway -n ecommerce --timeout=5m

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Status:"
kubectl get pods -n ecommerce
echo ""
kubectl get svc -n ecommerce
echo ""

# Get external IP
echo "🌐 Getting external IP (this may take a few minutes)..."
echo ""
echo "Run this command to get the API Gateway URL:"
echo "  kubectl get svc api-gateway -n ecommerce"
echo ""
echo "Access your API at: http://EXTERNAL-IP:4000"
echo ""
echo "📈 Access Grafana:"
echo "  kubectl port-forward svc/grafana -n ecommerce 3000:3000"
echo ""
echo "🔍 View logs:"
echo "  kubectl logs -f deployment/api-gateway -n ecommerce"
echo ""
echo "📊 Check HPAs:"
echo "  kubectl get hpa -n ecommerce"
