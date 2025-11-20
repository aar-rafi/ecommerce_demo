# Cloud Deployment Guide

## Recommended: Google Cloud Platform (GKE)

### Why GKE for Hackathons?
- ✅ $300 free credits for students
- ✅ Fastest K8s cluster setup (5 minutes)
- ✅ Best auto-scaling
- ✅ Integrated monitoring (Cloud Logging, Cloud Monitoring)
- ✅ Cheaper than AWS EKS

## GCP Setup (Step-by-Step)

### 1. Get Student Credits

Visit: https://cloud.google.com/edu
- Sign up with your student email
- Get $300 credits (12 months)

### 2. Install Tools

```bash
# Install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Install kubectl
gcloud components install kubectl

# Login
gcloud auth login

# Set project
gcloud config set project YOUR_PROJECT_ID
```

### 3. Create GKE Cluster

```bash
# Enable required APIs
gcloud services enable container.googleapis.com
gcloud services enable compute.googleapis.com

# Create cluster (optimized for cost)
gcloud container clusters create ecommerce-cluster \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-standard-2 \
  --disk-size 20 \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 6 \
  --enable-autorepair \
  --enable-autoupgrade \
  --enable-ip-alias

# Get credentials
gcloud container clusters get-credentials ecommerce-cluster --zone us-central1-a
```

**Cost estimate**: ~$50-80/month (covered by free credits)

### 4. Build and Push Images to GCR

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Build and push (using provided script)
./scripts/build-and-push-gcp.sh
```

### 5. Update K8s Manifests

```bash
# Update image references
./scripts/update-images-gcp.sh
```

### 6. Deploy to GKE

```bash
# Deploy everything
kubectl apply -f k8s/gcp/

# Or use the script
./scripts/deploy-gcp.sh

# Check deployment
kubectl get pods
kubectl get svc
```

### 7. Access Your Application

```bash
# Get external IP (LoadBalancer)
kubectl get svc api-gateway

# Wait for EXTERNAL-IP (takes 2-3 minutes)
# Access: http://EXTERNAL-IP:4000
```

### 8. Set Up Domain (Optional)

```bash
# Reserve static IP
gcloud compute addresses create ecommerce-ip --global

# Get the IP
gcloud compute addresses describe ecommerce-ip --global

# Update DNS A record: yourdomain.com -> IP

# Apply ingress with TLS
kubectl apply -f k8s/gcp/ingress-tls.yaml
```

## AWS Setup (Alternative)

### 1. Get AWS Credits

- AWS Educate: https://aws.amazon.com/education/awseducate/
- GitHub Student Pack includes AWS credits

### 2. Create EKS Cluster

```bash
# Install eksctl
brew install eksctl  # Mac
# OR
curl --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Create cluster
eksctl create cluster \
  --name ecommerce-cluster \
  --region us-east-1 \
  --nodegroup-name standard-workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 6 \
  --managed

# Get credentials (automatic)
aws eks update-kubeconfig --name ecommerce-cluster --region us-east-1
```

**Cost estimate**: ~$100-150/month (higher than GKE)

### 3. Push to ECR

```bash
# Create ECR repositories
./scripts/create-ecr-repos.sh

# Build and push
./scripts/build-and-push-aws.sh
```

### 4. Deploy

```bash
kubectl apply -f k8s/aws/
```

## DigitalOcean (If No Cloud Credits)

Only use if you have no student credits.

```bash
# Install doctl
brew install doctl  # Mac

# Authenticate
doctl auth init

# Create cluster ($60/month minimum)
doctl kubernetes cluster create ecommerce-cluster \
  --region nyc1 \
  --version 1.28.2-do.0 \
  --count 3 \
  --size s-2vcpu-4gb

# Get credentials
doctl kubernetes cluster kubeconfig save ecommerce-cluster
```

**Cost**: $60-80/month (no free credits)

## What Changes in K8s Manifests?

### 1. Image URLs

**Local/Minikube:**
```yaml
image: auth-service:latest
```

**GCP:**
```yaml
image: gcr.io/YOUR_PROJECT_ID/auth-service:v1
```

**AWS:**
```yaml
image: ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/auth-service:v1
```

### 2. Storage Classes

**Local:**
```yaml
storageClassName: standard  # or hostpath
```

**GCP:**
```yaml
storageClassName: standard-rwo  # Google Persistent Disk
```

**AWS:**
```yaml
storageClassName: gp3  # EBS gp3
```

### 3. Load Balancer

**Local (Minikube):**
```yaml
type: NodePort  # or port-forward
```

**Cloud:**
```yaml
type: LoadBalancer  # Creates cloud LB automatically
```

### 4. Ingress

**GCP uses different annotations:**
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  annotations:
    kubernetes.io/ingress.class: "gce"  # GCP
    # vs
    kubernetes.io/ingress.class: "alb"  # AWS
```

## Cost Comparison

| Provider | Monthly Cost | Free Credits | Setup Time | Best For |
|----------|--------------|--------------|------------|----------|
| **GCP GKE** | ~$60 | $300 (student) | 5 min | **Recommended** |
| AWS EKS | ~$120 | Varies | 15 min | If required |
| DigitalOcean | ~$60 | None | 10 min | No credits |
| Local (Minikube) | $0 | N/A | 2 min | Development only |

## My Recommendation for Hackathon

### **Option 1: GCP (Best for Demo)**
```bash
# Total setup time: ~20 minutes
1. Create GKE cluster (5 min)
2. Build and push images (10 min)
3. Deploy application (5 min)
4. Access via LoadBalancer IP
```

**Pros:**
- ✅ Professional setup
- ✅ Real auto-scaling demo
- ✅ Monitoring included
- ✅ Free with student credits
- ✅ Easy to show judges

**Cons:**
- Requires internet during demo
- Need to show cloud console

### **Option 2: Local Demo + Cloud Backup**
```bash
# Run locally during presentation
docker-compose up -d

# Have GKE running as backup
# Show cloud dashboard to judges
```

**Pros:**
- ✅ No internet dependency during demo
- ✅ Faster response times
- ✅ Can still show cloud deployment
- ✅ Best of both worlds

**Cons:**
- Can't demo auto-scaling live

### **Option 3: Hybrid (My Top Choice)**
```bash
# Demo flow:
1. Show local Docker Compose (fast, reliable)
2. Show monitoring (Grafana locally)
3. Switch to browser showing GKE dashboard
4. Show auto-scaling, pods, deployments
5. Show cloud monitoring
6. Access live cloud URL as backup
```

## Quick Deploy Commands

I'll create scripts for you:
- `scripts/deploy-gcp.sh` - Deploy to GCP
- `scripts/deploy-aws.sh` - Deploy to AWS
- `scripts/build-and-push-gcp.sh` - Build & push to GCR
- `scripts/build-and-push-aws.sh` - Build & push to ECR

## Cost Optimization Tips

### 1. Use Preemptible Nodes (GCP)
```bash
--preemptible  # 80% cheaper, good for demos
```

### 2. Use Spot Instances (AWS)
```bash
--node-type t3.medium --spot
```

### 3. Auto-shutdown After Hackathon
```bash
# GCP
gcloud container clusters delete ecommerce-cluster

# AWS
eksctl delete cluster --name ecommerce-cluster
```

### 4. Resource Limits
Already configured in your K8s manifests - prevents overspending

## Demo Day Strategy

**Before Demo:**
```bash
# 1 hour before: Deploy to cloud
./scripts/deploy-gcp.sh

# Verify everything works
kubectl get pods
curl http://EXTERNAL_IP:4000/health

# Start local backup
docker-compose up -d
```

**During Demo:**
```bash
# Primary: Show local (fast, reliable)
http://localhost:4000

# Wow factor: Show cloud dashboard
- GKE cluster view
- Auto-scaling in action
- Monitoring dashboards
- Live pods scaling up/down
```

**If Internet Issues:**
```bash
# Fall back to local instantly
# Everything still works!
```

## Student Credits Links

- **GCP**: https://cloud.google.com/edu ($300)
- **AWS**: https://aws.amazon.com/education/awseducate/ (Varies)
- **Azure**: https://azure.microsoft.com/en-us/free/students/ ($100)
- **GitHub Student Pack**: https://education.github.com/pack (includes many cloud credits)

## Next Steps

1. **Get student credits** (do this today - takes 24-48 hours)
2. **I'll create GCP-specific scripts** for you
3. **Test locally first** with Docker Compose
4. **Deploy to GCP 2 days before hackathon**
5. **Verify everything works**
6. **Keep local backup ready**

Want me to create the GCP/AWS-specific deployment scripts now?
