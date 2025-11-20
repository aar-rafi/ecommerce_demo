#!/bin/bash

set -e

echo "🚀 Creating GKE Cluster for E-Commerce Platform"
echo ""

# Configuration
CLUSTER_NAME="${CLUSTER_NAME:-ecommerce-cluster}"
ZONE="${ZONE:-us-central1-a}"
MACHINE_TYPE="${MACHINE_TYPE:-e2-standard-2}"
NUM_NODES="${NUM_NODES:-3}"
MIN_NODES="${MIN_NODES:-2}"
MAX_NODES="${MAX_NODES:-6}"

echo "Cluster Configuration:"
echo "  Name: $CLUSTER_NAME"
echo "  Zone: $ZONE"
echo "  Machine Type: $MACHINE_TYPE (2 vCPU, 8GB RAM)"
echo "  Initial Nodes: $NUM_NODES"
echo "  Auto-scaling: $MIN_NODES - $MAX_NODES nodes"
echo ""
echo "Estimated cost: ~$50-80/month (covered by student credits)"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found"
    echo "Install from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Enable required APIs
echo "📋 Enabling required APIs..."
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com

# Create cluster
echo ""
echo "🏗️  Creating GKE cluster (this takes ~5-7 minutes)..."
gcloud container clusters create $CLUSTER_NAME \
  --zone $ZONE \
  --num-nodes $NUM_NODES \
  --machine-type $MACHINE_TYPE \
  --disk-size 20 \
  --disk-type pd-standard \
  --enable-autoscaling \
  --min-nodes $MIN_NODES \
  --max-nodes $MAX_NODES \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-ip-alias \
  --network "default" \
  --subnetwork "default" \
  --logging=SYSTEM,WORKLOAD \
  --monitoring=SYSTEM

# Get credentials
echo ""
echo "🔐 Getting cluster credentials..."
gcloud container clusters get-credentials $CLUSTER_NAME --zone $ZONE

# Verify connection
echo ""
echo "✅ Cluster created successfully!"
echo ""
kubectl cluster-info
echo ""
kubectl get nodes
echo ""

# Install metrics server (for HPA)
echo "📊 Installing metrics server for auto-scaling..."
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

echo ""
echo "🎉 GKE cluster is ready!"
echo ""
echo "Next steps:"
echo "  1. Build and push images: ./scripts/build-and-push-gcp.sh"
echo "  2. Update manifests: ./scripts/update-images-gcp.sh"
echo "  3. Deploy application: ./scripts/deploy-gcp.sh"
echo ""
echo "To delete cluster when done:"
echo "  gcloud container clusters delete $CLUSTER_NAME --zone $ZONE"
echo ""
echo "💰 Cost reminder: Don't forget to delete the cluster when done!"
