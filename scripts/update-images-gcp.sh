#!/bin/bash

set -e

PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
VERSION="${VERSION:-v1}"

echo "🔄 Updating K8s manifests with GCR image URLs"
echo "Project ID: $PROJECT_ID"
echo "Version: $VERSION"
echo ""

# Get project ID from gcloud if not set
if [ "$PROJECT_ID" = "your-project-id" ]; then
    if command -v gcloud &> /dev/null; then
        PROJECT_ID=$(gcloud config get-value project)
        echo "Using project from gcloud config: $PROJECT_ID"
    else
        echo "❌ Please set GCP_PROJECT_ID environment variable"
        exit 1
    fi
fi

# Create GCP-specific directory
mkdir -p k8s/gcp
cp -r k8s/deployments/* k8s/gcp/
cp -r k8s/configmaps k8s/gcp/
cp -r k8s/secrets k8s/gcp/
cp -r k8s/monitoring k8s/gcp/

# Update image references
SERVICES=(
    "auth-service"
    "product-catalog"
    "cart-service"
    "order-service"
    "notification-service"
    "api-gateway"
)

for service in "${SERVICES[@]}"; do
    FILE="k8s/gcp/${service}.yaml"
    if [ -f "$FILE" ]; then
        echo "Updating $service..."

        # macOS vs Linux sed compatibility
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|image: ${service}:latest|image: gcr.io/${PROJECT_ID}/${service}:${VERSION}|g" "$FILE"
        else
            sed -i "s|image: ${service}:latest|image: gcr.io/${PROJECT_ID}/${service}:${VERSION}|g" "$FILE"
        fi
    fi
done

# Update storage class for GCP
echo "Updating storage classes..."
find k8s/gcp -name "*.yaml" -type f | while read file; do
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's/storageClassName: standard/storageClassName: standard-rwo/g' "$file"
    else
        sed -i 's/storageClassName: standard/storageClassName: standard-rwo/g' "$file"
    fi
done

echo ""
echo "✅ Manifests updated in k8s/gcp/"
echo ""
echo "Image URLs:"
for service in "${SERVICES[@]}"; do
    echo "  gcr.io/$PROJECT_ID/$service:$VERSION"
done
echo ""
echo "Next step:"
echo "  ./scripts/deploy-gcp.sh"
