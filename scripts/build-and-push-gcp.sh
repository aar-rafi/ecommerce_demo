#!/bin/bash

set -e

# GCP Project ID (set this to your project)
PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"

echo "🚀 Building and pushing images to Google Container Registry (GCR)"
echo "Project ID: $PROJECT_ID"
echo ""

# Check if gcloud is configured
if ! gcloud config get-value project &> /dev/null; then
    echo "❌ Please configure gcloud first:"
    echo "   gcloud auth login"
    echo "   gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

# Get project ID from gcloud if not set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    PROJECT_ID=$(gcloud config get-value project)
    echo "Using project from gcloud config: $PROJECT_ID"
fi

# Configure Docker for GCR
echo "🔐 Configuring Docker authentication..."
gcloud auth configure-docker

SERVICES=(
    "auth-service"
    "product-catalog"
    "cart-service"
    "order-service"
    "notification-service"
    "api-gateway"
)

VERSION="${VERSION:-v1}"

for service in "${SERVICES[@]}"; do
    echo ""
    echo "📦 Building $service..."

    # Build image
    docker build -t "gcr.io/$PROJECT_ID/$service:$VERSION" \
                 -t "gcr.io/$PROJECT_ID/$service:latest" \
                 "./services/$service"

    echo "⬆️  Pushing $service..."
    docker push "gcr.io/$PROJECT_ID/$service:$VERSION"
    docker push "gcr.io/$PROJECT_ID/$service:latest"

    echo "✅ $service pushed successfully"
done

echo ""
echo "🎉 All images built and pushed to GCR!"
echo ""
echo "Images available at:"
for service in "${SERVICES[@]}"; do
    echo "  gcr.io/$PROJECT_ID/$service:$VERSION"
done
echo ""
echo "Next steps:"
echo "  1. Update K8s manifests: ./scripts/update-images-gcp.sh"
echo "  2. Deploy to GKE: ./scripts/deploy-gcp.sh"
