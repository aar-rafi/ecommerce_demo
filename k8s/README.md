# Kubernetes Deployment Guide

This directory contains Kubernetes manifests for deploying the e-commerce microservices platform.

## Prerequisites

- Kubernetes cluster (minikube, kind, EKS, GKE, AKS, etc.)
- kubectl configured
- Docker images built and available

## Quick Start

### 1. Build Docker Images

```bash
# Build all service images
docker build -t auth-service:latest ./services/auth-service
docker build -t product-catalog:latest ./services/product-catalog
docker build -t cart-service:latest ./services/cart-service
docker build -t order-service:latest ./services/order-service
docker build -t notification-service:latest ./services/notification-service
docker build -t api-gateway:latest ./services/api-gateway
```

### 2. Deploy to Kubernetes

```bash
# Create namespace (optional)
kubectl create namespace ecommerce

# Apply secrets and configmaps first
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/

# Deploy databases and infrastructure
kubectl apply -f k8s/deployments/postgres.yaml
kubectl apply -f k8s/deployments/redis.yaml

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis --timeout=300s

# Deploy microservices
kubectl apply -f k8s/deployments/auth-service.yaml
kubectl apply -f k8s/deployments/product-catalog.yaml
kubectl apply -f k8s/deployments/cart-service.yaml
kubectl apply -f k8s/deployments/order-service.yaml
kubectl apply -f k8s/deployments/notification-service.yaml
kubectl apply -f k8s/deployments/api-gateway.yaml

# Deploy monitoring
kubectl apply -f k8s/monitoring/

# Or apply all at once (after secrets/configmaps)
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/monitoring/
```

### 3. Verify Deployment

```bash
# Check all pods
kubectl get pods

# Check services
kubectl get svc

# Check HPAs
kubectl get hpa

# View logs
kubectl logs -l app=api-gateway --tail=50 -f
```

### 4. Access Services

```bash
# Get API Gateway URL
kubectl get svc api-gateway

# Port forward for local access
kubectl port-forward svc/api-gateway 4000:4000

# Access Prometheus
kubectl port-forward svc/prometheus 9090:9090

# Access Grafana
kubectl port-forward svc/grafana 3000:3000
```

## Components

### Deployments
- **postgres.yaml**: PostgreSQL database with PVC
- **redis.yaml**: Redis cache with PVC
- **auth-service.yaml**: Authentication service with HPA
- **product-catalog.yaml**: Product catalog with HPA
- **cart-service.yaml**: Shopping cart service
- **order-service.yaml**: Order management service
- **notification-service.yaml**: Notification service
- **api-gateway.yaml**: API Gateway with HPA (LoadBalancer)

### ConfigMaps & Secrets
- **service-config**: Service URLs and environment configs
- **db-secrets**: Database credentials and JWT secrets

### Monitoring
- **prometheus.yaml**: Metrics collection
- **grafana.yaml**: Visualization dashboards

## Scaling

### Manual Scaling
```bash
kubectl scale deployment auth-service --replicas=5
```

### Auto-scaling
HPAs are configured for:
- API Gateway: 3-20 replicas (60% CPU, 75% memory)
- Auth Service: 2-10 replicas (70% CPU, 80% memory)
- Product Catalog: 2-10 replicas (70% CPU)

## Updating Services

```bash
# Update image
kubectl set image deployment/auth-service auth-service=auth-service:v2

# Rolling restart
kubectl rollout restart deployment/auth-service

# Check rollout status
kubectl rollout status deployment/auth-service

# Rollback if needed
kubectl rollout undo deployment/auth-service
```

## Troubleshooting

```bash
# Check pod status
kubectl describe pod <pod-name>

# View logs
kubectl logs <pod-name>
kubectl logs -f <pod-name> # follow

# Execute commands in pod
kubectl exec -it <pod-name> -- /bin/sh

# Check events
kubectl get events --sort-by='.lastTimestamp'

# Check resource usage
kubectl top pods
kubectl top nodes
```

## Production Considerations

1. **Secrets Management**: Use external secret managers (AWS Secrets Manager, HashiCorp Vault)
2. **Ingress**: Set up Ingress controller (NGINX, Traefik) instead of LoadBalancer
3. **TLS**: Configure SSL/TLS certificates
4. **Resource Limits**: Adjust based on actual usage
5. **Persistence**: Use appropriate StorageClasses for your cloud provider
6. **Monitoring**: Add alerting rules to Prometheus
7. **Backup**: Set up automated database backups
8. **Network Policies**: Implement network policies for security

## Clean Up

```bash
# Delete all resources
kubectl delete -f k8s/deployments/
kubectl delete -f k8s/monitoring/
kubectl delete -f k8s/configmaps/
kubectl delete -f k8s/secrets/

# Delete PVCs
kubectl delete pvc --all

# Delete namespace (if created)
kubectl delete namespace ecommerce
```
