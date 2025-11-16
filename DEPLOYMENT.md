# Deployment Guide

This document provides comprehensive instructions for deploying rosistat-devops across different environments.

## Project Structure

- **Frontend**: React + TypeScript (Vite) → Vercel, Netlify, or GitHub Pages
- **Backend**: Node.js + Express + SQLite → Docker, Cloud Run, Kubernetes, or VPS
- **Database**: SQLite (local file-based) → persistent volume in containers

---

## Frontend Deployment

### Option 1: Vercel (Recommended - Easiest)

**Prerequisites:**
- GitHub account with code pushed

**Steps:**
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel auto-detects settings (uses `vercel.json`)
5. Click "Deploy"

**Result:**
- URL: `https://your-project-name.vercel.app`
- Auto-deploy on Git push
- SSL included
- ~2 minutes to deployment

### Option 2: Netlify

**Steps:**
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Select GitHub repository
4. Netlify uses `netlify.toml` configuration
5. Click "Deploy site"

**Result:**
- URL: `https://your-project.netlify.app`
- Edge Functions available
- Form handling support
- ~2-3 minutes to deployment

### Option 3: GitHub Pages (Free)

**Steps:**
1. Go to repository Settings → Pages
2. Select "GitHub Actions" as source
3. Workflow in `.github/workflows/` auto-deploys

**Result:**
- URL: `https://yourusername.github.io/repository-name`
- Completely free
- ~3-5 minutes to deployment

### Local Testing

```bash
npm run build
npm run preview
```

---

## Backend Deployment

### Option 1: Docker (Recommended - Production-Ready)

**Prerequisites:**
- Docker installed
- Container registry (Docker Hub, ECR, GCR, GitHub Container Registry)
- Cloud platform (AWS ECS, Google Cloud Run, Azure Container Instances, DigitalOcean App Platform)

**Build image:**
```bash
docker build -t rosistat-backend:latest -f backend/Dockerfile backend/
```

**Tag for registry:**
```bash
docker tag rosistat-backend:latest your-registry/rosistat-backend:latest
```

**Push to registry:**
```bash
docker login
docker push your-registry/rosistat-backend:latest
```

**Run locally:**
```bash
docker run -d --name rosistat-backend \
  -p 8080:8080 \
  -v /var/lib/rosistat:/var/lib/rosistat \
  -e NODE_ENV=production \
  -e DB_FILE=/var/lib/rosistat/rosistat.db \
  rosistat-backend:latest
```

**Health check:**
```bash
curl http://localhost:8080/api/health
```

### Option 2: Google Cloud Run (Serverless)

**Prerequisites:**
- Google Cloud Project
- Cloud Run API enabled
- Docker image pushed to Google Container Registry

**Deploy:**
```bash
gcloud run deploy rosistat-backend \
  --image gcr.io/your-project/rosistat-backend:latest \
  --platform managed \
  --region us-central1 \
  --memory 512Mi \
  --timeout 60 \
  --set-env-vars NODE_ENV=production,DB_FILE=/tmp/rosistat.db
```

**Note:** Cloud Run uses ephemeral storage; use Cloud Storage or Cloud SQL for persistent data.

### Option 3: Railway (Easiest Cloud - Paid)

**Steps:**
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Connect GitHub repository
4. Railway auto-deploys on push
5. Add environment variables in Railway dashboard

**Features:**
- Auto-scaling
- Built-in database support
- Easy environment management
- ~5 minutes to deployment

### Option 4: Kubernetes

**Prerequisites:**
- Kubernetes cluster (AWS EKS, Google GKE, Azure AKS, or minikube)
- kubectl installed
- Docker image pushed to registry

**Deploy:**
```bash
kubectl apply -f infrastructure/k8s/
```

**Check deployment:**
```bash
kubectl get pods
kubectl logs deployment/rosistat-backend
```

### Option 5: VPS (AWS EC2, DigitalOcean, Linode, etc.)

**Prerequisites:**
- SSH access to server
- Node.js 20+ installed
- PM2 for process management (optional)

**Deploy:**
```bash
# SSH into server
ssh user@your-server.com

# Clone repository
git clone https://github.com/yourusername/rosistat-devops.git
cd rosistat-devops/backend

# Install and build
npm ci
npm run build

# Set environment variables
cp .env.example .env
# Edit .env with production values

# Start with PM2
npm install -g pm2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## Database

### SQLite (Current Default)

**Advantages:**
- Zero setup
- File-based (easy backup)
- Good for single-server deployments
- No separate database service needed

**Considerations:**
- Not suitable for high-concurrency scenarios
- Limited to one write at a time
- Consider migrating to PostgreSQL/MySQL for production scale

**Backup:**
```bash
sqlite3 /var/lib/rosistat/rosistat.db ".dump" > backup.sql
```

**Restore:**
```bash
sqlite3 /var/lib/rosistat/rosistat_new.db < backup.sql
```

### Migrate to PostgreSQL (Optional)

See `docs/MIGRATION.md` (if exists) or contact development team for migration guide.

---

## Environment Variables

Create `.env` file from `.env.example`:

```bash
# Core
PORT=8080
NODE_ENV=production

# Database
DB_FILE=/var/lib/rosistat/rosistat.db

# Optional
LOG_LEVEL=info
TRUST_PROXY=true
```

**In CI/CD or containers:** Inject via platform-specific secret management:
- GitHub Secrets → `GITHUB_TOKEN`
- AWS Systems Manager Parameter Store → `DB_PASSWORD`
- Google Secret Manager → environment variables
- Kubernetes Secrets → mounted files or environment variables

---

## SSL/TLS

### Vercel & Netlify
✅ Automatic SSL included

### GitHub Pages
✅ Automatic SSL included

### Cloud Run
✅ Automatic SSL included

### Kubernetes
Use cert-manager or cloud provider's load balancer:
```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml
```

### VPS / Traditional Server
Use Let's Encrypt with Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly -d yourdomain.com
# Add certificate to your reverse proxy (Nginx, Apache, HAProxy)
```

---

## Monitoring & Observability

### Health Checks

All deployment options should monitor the health endpoint:
```bash
curl https://api.yourdomain.com/api/health
```

Expected response:
```json
{
  "status": "ok",
  "env": "production",
  "dbReady": true
}
```

### Logs

- **Docker**: `docker logs <container-id>`
- **Cloud Run**: `gcloud run logs read rosistat-backend`
- **Kubernetes**: `kubectl logs <pod-name>`
- **VPS**: `pm2 logs` or `tail -f /var/log/rosistat/backend.log`

### Metrics

Set up monitoring with:
- Datadog
- New Relic
- Prometheus + Grafana
- Google Cloud Monitoring
- AWS CloudWatch

---

## CI/CD

GitHub Actions workflow (`.github/workflows/backend-ci.yml`) includes:
- Build and test on every push
- Docker image build on main branch
- Health checks
- Smoke tests

### Automated Deployment

To enable automated deployment on push:

**Example: Deploy to Railway on main branch**
```yaml
- name: Deploy to Railway
  run: railway deploy --service rosistat-backend
```

**Example: Deploy to Cloud Run**
```yaml
- name: Deploy to Cloud Run
  run: |
    gcloud run deploy rosistat-backend \
      --image gcr.io/${{ secrets.GCP_PROJECT }}/rosistat-backend:${{ github.sha }}
```

---

## Rollback Procedures

### Docker / Cloud Platforms
```bash
# Revert to previous image tag
docker pull your-registry/rosistat-backend:v1.0.0
docker run -d ... your-registry/rosistat-backend:v1.0.0
```

### Git-Based (Railway, Vercel, Netlify)
```bash
git revert <bad-commit-hash>
git push origin main
# Platform auto-deploys
```

### Kubernetes
```bash
kubectl rollout undo deployment/rosistat-backend
```

### VPS + PM2
```bash
pm2 logs rosistat-backend  # Check what went wrong
pm2 restart rosistat-backend
# Or restart from previous known-good version
```

---

## Security Checklist

- [ ] Environment variables loaded from secrets (not hardcoded)
- [ ] Database file has restricted permissions (600)
- [ ] HTTPS/SSL enforced
- [ ] Health endpoint monitored
- [ ] Logs aggregated and monitored
- [ ] Backups automated
- [ ] Secrets rotated regularly
- [ ] Rate limiting enabled (if applicable)
- [ ] Input validation in place
- [ ] Database credentials not exposed in logs

---

## Troubleshooting

### Backend won't start
1. Check logs for missing environment variables
2. Verify database file path is correct
3. Ensure migrations applied: check `GET /api/health` response
4. Check disk space for SQLite file growth

### Health check failing
1. Verify backend process is running
2. Check port is open and accessible
3. Test health endpoint locally: `curl http://localhost:8080/api/health`
4. Check database permissions

### Database locked
1. Ensure only one process writing to SQLite
2. Check for stale locks: `rm /var/lib/rosistat/rosistat.db-wal /var/lib/rosistat/rosistat.db-shm`
3. Consider migrating to PostgreSQL for high concurrency

---

## References

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Deployment Guide](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/)
- [Vercel Deployment](https://vercel.com/docs)
- [Netlify Deployment](https://docs.netlify.com/)
- [Google Cloud Run](https://cloud.google.com/run/docs)
- [Railway Deployment](https://docs.railway.app/)
