# Deployment Guide

Complete guide to deploying the e-commerce platform in different environments.

## Prerequisites

- Docker & Docker Compose
- Kubernetes cluster (for K8s deployment)
- kubectl configured
- Git

## Local Development Deployment

### Option 1: Docker Compose (Recommended)

**Quickest way to get started:**

```bash
# 1. Clone repository
git clone <repository-url>
cd ecommerce_demo

# 2. Create .env file
cp .env.example .env

# 3. Start all services
docker-compose up -d

# 4. Check service health
docker-compose ps

# 5. View logs
docker-compose logs -f api-gateway

# 6. Seed sample data (optional)
./scripts/seed-data.sh
```

**Access services:**
- API Gateway: http://localhost:4000
- Frontend: http://localhost:3000 (when built)
- Grafana: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090
- Kibana: http://localhost:5601

**Stop services:**
```bash
docker-compose down

# Remove volumes (clean slate)
docker-compose down -v
```

### Option 2: Local Development (Hot Reload)

**For active development:**

```bash
# 1. Install dependencies
./scripts/install-deps.sh

# 2. Start infrastructure (Postgres, Redis, Monitoring)
docker-compose up -d postgres redis prometheus grafana

# 3. Start services in development mode
./scripts/dev.sh

# This starts all services with hot reload enabled
```

**Stop services:**
```bash
./scripts/stop-dev.sh
```

## Kubernetes Deployment

### Local Kubernetes (Minikube/Kind)

**1. Start local cluster:**

```bash
# Minikube
minikube start --cpus=4 --memory=8192

# OR Kind
kind create cluster --name ecommerce
```

**2. Build and load images:**

```bash
# Build all images
./scripts/build-images.sh

# Load images into minikube
minikube image load auth-service:latest
minikube image load product-catalog:latest
minikube image load cart-service:latest
minikube image load order-service:latest
minikube image load notification-service:latest
minikube image load api-gateway:latest

# OR for Kind
kind load docker-image auth-service:latest --name ecommerce
# ... repeat for other services
```

**3. Deploy to Kubernetes:**

```bash
./scripts/deploy-k8s.sh
```

**4. Access services:**

```bash
# Port forward API Gateway
kubectl port-forward svc/api-gateway 4000:4000

# OR use minikube service
minikube service api-gateway

# Access Grafana
kubectl port-forward svc/grafana 3000:3000
```

**5. Scale services:**

```bash
# Manual scaling
kubectl scale deployment auth-service --replicas=5

# Check HPA status
kubectl get hpa
```

**6. Monitor deployment:**

```bash
# Watch pods
kubectl get pods -w

# Check logs
kubectl logs -f deployment/api-gateway

# Check resource usage
kubectl top pods
kubectl top nodes
```

### Cloud Kubernetes (EKS, GKE, AKS)

#### AWS EKS Example

**1. Create EKS cluster:**

```bash
eksctl create cluster \
  --name ecommerce-prod \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 10 \
  --managed
```

**2. Configure kubectl:**

```bash
aws eks update-kubeconfig --name ecommerce-prod --region us-east-1
```

**3. Build and push images to ECR:**

```bash
# Create ECR repositories
aws ecr create-repository --repository-name ecommerce/auth-service
# ... repeat for other services

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and push
docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecommerce/auth-service:latest \
  ./services/auth-service
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/ecommerce/auth-service:latest
# ... repeat for other services
```

**4. Update K8s manifests:**

Update image references in deployment files to use ECR URLs.

**5. Deploy:**

```bash
kubectl apply -f k8s/secrets/
kubectl apply -f k8s/configmaps/
kubectl apply -f k8s/deployments/
kubectl apply -f k8s/monitoring/
```

**6. Set up Ingress (ALB):**

```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=ecommerce-prod

# Apply ingress
kubectl apply -f k8s/ingress/alb-ingress.yaml
```

**7. Configure DNS:**

Point your domain to the ALB created by the ingress.

#### Google GKE Example

```bash
# Create cluster
gcloud container clusters create ecommerce-prod \
  --num-nodes=3 \
  --machine-type=n1-standard-2 \
  --region=us-central1

# Get credentials
gcloud container clusters get-credentials ecommerce-prod --region=us-central1

# Build and push to GCR
gcloud builds submit --tag gcr.io/<project-id>/auth-service ./services/auth-service

# Deploy
kubectl apply -f k8s/
```

## Production Deployment Checklist

### Pre-Deployment

- [ ] Update secrets with production values
- [ ] Configure production database (RDS, Cloud SQL, etc.)
- [ ] Set up managed Redis (ElastiCache, Cloud Memorystore)
- [ ] Review resource limits and requests
- [ ] Configure auto-scaling parameters
- [ ] Set up monitoring and alerting
- [ ] Configure backup strategy
- [ ] Review security settings
- [ ] Set up SSL/TLS certificates
- [ ] Configure CDN (if using)
- [ ] Plan rollback strategy

### Secrets Management

**Option 1: Kubernetes Secrets (Basic)**
```bash
kubectl create secret generic db-secrets \
  --from-literal=DB_USER=produser \
  --from-literal=DB_PASSWORD=<strong-password> \
  --from-literal=JWT_SECRET=<random-secret>
```

**Option 2: External Secrets (Recommended)**
```bash
# AWS Secrets Manager
helm install external-secrets external-secrets/external-secrets

# Create ExternalSecret resource
kubectl apply -f - <<EOF
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
  target:
    name: db-secrets
  data:
  - secretKey: DB_PASSWORD
    remoteRef:
      key: prod/database/password
EOF
```

### Database Setup

**Managed Database (Recommended for Production):**

```bash
# AWS RDS PostgreSQL
aws rds create-db-instance \
  --db-instance-identifier ecommerce-prod-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 16.1 \
  --master-username postgres \
  --master-user-password <password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false

# Update connection strings in secrets
```

### Monitoring Setup

**1. Prometheus + Grafana:**

Already included in K8s manifests. For production:

```bash
# Install with Helm (more options)
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm install prometheus prometheus-community/kube-prometheus-stack

# Import custom dashboards
kubectl apply -f monitoring/grafana/dashboards/
```

**2. Configure Alerting:**

```yaml
# alertmanager-config.yaml
route:
  receiver: 'slack-notifications'
  group_by: ['alertname']

receivers:
- name: 'slack-notifications'
  slack_configs:
  - api_url: '<slack-webhook-url>'
    channel: '#alerts'
```

**3. Set up Log Forwarding:**

```bash
# Fluentd to forward logs to CloudWatch/Stackdriver
kubectl apply -f logging/fluentd-daemonset.yaml
```

## Deployment Strategies

### Rolling Update (Default)

Zero-downtime deployment:

```bash
# Update image
kubectl set image deployment/auth-service \
  auth-service=auth-service:v2

# Monitor rollout
kubectl rollout status deployment/auth-service

# Rollback if needed
kubectl rollout undo deployment/auth-service
```

### Blue-Green Deployment

```bash
# Deploy green version
kubectl apply -f deployments/auth-service-green.yaml

# Test green version
kubectl port-forward svc/auth-service-green 5000:5000

# Switch traffic (update service selector)
kubectl patch service auth-service -p '{"spec":{"selector":{"version":"green"}}}'

# Keep blue for rollback, delete later
kubectl delete deployment auth-service-blue
```

### Canary Deployment

```bash
# Deploy canary (10% traffic)
kubectl apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: auth-service-canary
spec:
  selector:
    app: auth-service
    version: canary
  ports:
  - port: 5000
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service-canary
spec:
  replicas: 1  # 10% of main deployment
  selector:
    matchLabels:
      app: auth-service
      version: canary
  template:
    metadata:
      labels:
        app: auth-service
        version: canary
    spec:
      containers:
      - name: auth-service
        image: auth-service:v2
EOF

# Monitor metrics
# If good, increase canary replicas
# If bad, delete canary deployment
```

## CI/CD Deployment

Handled automatically by GitHub Actions:

- **Push to `develop`** → Deploy to staging
- **Push to `main`** → Deploy to production (with approval)

### Manual Trigger

```bash
# Trigger deployment manually
gh workflow run ci-cd.yml -f environment=production
```

## Post-Deployment

### Health Checks

```bash
# Check all pods
kubectl get pods

# Test API Gateway
curl http://<api-gateway-url>/health

# Run smoke tests
./scripts/smoke-tests.sh
```

### Performance Testing

```bash
# Apache Bench
ab -n 10000 -c 100 http://<api-gateway-url>/api/products

# Or use k6
k6 run tests/load-test.js
```

### Monitoring

1. Access Grafana dashboards
2. Set up alerts in Prometheus
3. Check logs in Kibana
4. Monitor cost in cloud console

## Backup & Restore

### Backup

```bash
# Database backup
kubectl exec -it postgres-0 -- \
  pg_dump -U postgres ecommerce_auth > backup-auth.sql

# Or use managed backup
aws rds create-db-snapshot \
  --db-instance-identifier ecommerce-prod-db \
  --db-snapshot-identifier ecommerce-backup-$(date +%Y%m%d)
```

### Restore

```bash
# From backup file
kubectl exec -i postgres-0 -- \
  psql -U postgres ecommerce_auth < backup-auth.sql

# Or restore RDS snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier ecommerce-prod-db-restored \
  --db-snapshot-identifier ecommerce-backup-20240101
```

## Scaling

### Horizontal Scaling

```bash
# Manual
kubectl scale deployment api-gateway --replicas=10

# Auto-scaling (already configured via HPA)
kubectl get hpa
```

### Vertical Scaling

Update resource limits in deployment files:

```yaml
resources:
  requests:
    cpu: 500m
    memory: 1Gi
  limits:
    cpu: 2000m
    memory: 4Gi
```

## Troubleshooting

### Pods Not Starting

```bash
kubectl describe pod <pod-name>
kubectl logs <pod-name>
```

Common issues:
- Image pull errors
- Resource limits
- Config/secret missing

### Service Unavailable

```bash
# Check service endpoints
kubectl get endpoints <service-name>

# Check pod health
kubectl get pods -l app=<service-name>
```

### Database Connection Issues

```bash
# Test from pod
kubectl exec -it <pod-name> -- \
  psql -h postgres -U postgres -d ecommerce_auth
```

## Clean Up

### Remove Deployment

```bash
# Delete all resources
kubectl delete -f k8s/

# Delete PVCs
kubectl delete pvc --all

# Delete cluster (local)
minikube delete
kind delete cluster --name ecommerce

# Delete cloud resources
eksctl delete cluster --name ecommerce-prod
```

## Cost Optimization

1. Use spot instances for non-critical workloads
2. Set appropriate resource limits
3. Enable cluster autoscaler
4. Use reserved instances for stable workloads
5. Monitor and right-size resources
6. Set up budget alerts

## Security Hardening

1. Enable network policies
2. Use Pod Security Policies/Standards
3. Rotate secrets regularly
4. Enable audit logging
5. Use private subnets for databases
6. Enable encryption at rest
7. Regular security scans
8. Implement RBAC

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [GKE Best Practices](https://cloud.google.com/kubernetes-engine/docs/best-practices)
