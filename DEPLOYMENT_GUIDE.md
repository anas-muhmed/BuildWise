# 🚀 Deployment Guide

## Quick Start - Docker Deployment

### Prerequisites
- Docker & Docker Compose installed
- Git
- Node.js 20+ (for local development)

### 1. Clone and Setup

```bash
# Clone repository
git clone <your-repo-url>
cd buildwise

# Copy environment template
cp .env.example .env.local

# Edit .env.local with your secrets
nano .env.local
```

### 2. Configure Environment

**CRITICAL** - Update these in `.env.local`:

```bash
# Generate a secure JWT secret (32+ characters)
JWT_SECRET=$(openssl rand -base64 32)

# Set a strong MongoDB password
MONGO_PASSWORD=$(openssl rand -base64 24)

# Disable setup mode for production
SETUP_MODE=false
```

### 3. Build and Run

```bash
# Build and start all services
docker-compose up -d

# Check logs
docker-compose logs -f app

# Check health
curl http://localhost:3000/api/health
```

### 4. Initial Admin Setup

**First time only** - Create your admin user:

```bash
# 1. Enable setup mode temporarily
echo "SETUP_MODE=true" >> .env.local
echo "SETUP_SECRET=my-secret-123" >> .env.local

# 2. Restart container
docker-compose restart app

# 3. Register your account via UI or API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"admin@example.com","password":"secure123"}'

# 4. Promote to admin
curl -X POST http://localhost:3000/api/setup/promote-admin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","secret":"my-secret-123"}'

# 5. DISABLE setup mode
sed -i '/SETUP_MODE/d' .env.local
sed -i '/SETUP_SECRET/d' .env.local

# 6. Restart
docker-compose restart app
```

---

## Production Deployment

### Option 1: Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Create secrets
echo "your-jwt-secret" | docker secret create jwt_secret -
echo "your-mongo-password" | docker secret create mongo_password -

# Deploy stack
docker stack deploy -c docker-compose.prod.yml buildwise

# Check status
docker stack services buildwise
```

### Option 2: Kubernetes

```bash
# Create namespace
kubectl create namespace buildwise

# Create secrets
kubectl create secret generic buildwise-secrets \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=mongo-password=your-mongo-password \
  -n buildwise

# Apply manifests
kubectl apply -f k8s/ -n buildwise

# Check status
kubectl get pods -n buildwise
```

### Option 3: Cloud Platforms

#### Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# - MONGODB_URI
# - JWT_SECRET
# - All variables from .env.example
```

#### AWS ECS/Fargate

1. Push image to ECR:
```bash
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker build -t buildwise .
docker tag buildwise:latest <account>.dkr.ecr.us-east-1.amazonaws.com/buildwise:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/buildwise:latest
```

2. Create ECS task definition and service
3. Configure Application Load Balancer
4. Set environment variables in task definition

#### Digital Ocean App Platform

1. Connect GitHub repository
2. Configure build settings:
   - Build Command: `npm run build`
   - Run Command: `npm start`
3. Set environment variables
4. Deploy

---

## Database Setup

### MongoDB

**Development (Local):**
```bash
# Using Docker
docker run -d -p 27017:27017 --name buildwise-mongo \
  -e MONGO_INITDB_ROOT_USERNAME=buildwise \
  -e MONGO_INITDB_ROOT_PASSWORD=changeme \
  mongo:7-jammy
```

**Production Options:**
- **MongoDB Atlas** (Managed, recommended)
  - Free tier available
  - Automatic backups
  - Global distribution
  - Connection string: `mongodb+srv://user:pass@cluster.mongodb.net/buildwise`

- **Self-hosted:**
  - Use replica set for high availability
  - Enable authentication
  - Configure backups
  - Use SSL/TLS

### Prisma Database

**Recommended: PostgreSQL for production**

```bash
# Update DATABASE_URL in .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/buildwise

# Run migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | - | MongoDB connection string |
| `DATABASE_URL` | Yes | - | Prisma database URL |
| `JWT_SECRET` | Yes | - | JWT signing secret (32+ chars) |
| `JWT_ISSUER` | No | `buildwise` | JWT issuer claim |
| `JWT_EXPIRES_IN` | No | `30d` | Token expiration |
| `NODE_ENV` | Yes | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `APP_URL` | Yes | - | Public app URL |
| `SETUP_MODE` | No | `false` | Enable admin promotion |
| `SETUP_SECRET` | No | - | Setup endpoint secret |
| `SENTRY_DSN` | No | - | Error tracking DSN |
| `LOG_LEVEL` | No | `info` | Logging level |

---

## Security Checklist

Before deploying to production:

- [ ] Change `JWT_SECRET` to cryptographically random string (32+ chars)
- [ ] Set `SETUP_MODE=false`
- [ ] Remove or secure `SETUP_SECRET`
- [ ] Use HTTPS (SSL/TLS) for all traffic
- [ ] Enable CORS only for trusted origins
- [ ] Set strong MongoDB credentials
- [ ] Enable MongoDB authentication
- [ ] Use environment-specific databases (not shared dev/prod)
- [ ] Enable database backups (automated)
- [ ] Set up monitoring/alerting
- [ ] Configure rate limiting
- [ ] Review and minimize IAM permissions
- [ ] Enable audit logging
- [ ] Scan for vulnerabilities (`npm audit`)
- [ ] Keep dependencies updated
- [ ] Use secrets management (AWS Secrets Manager, etc.)

---

## Monitoring & Logging

### Health Checks

```bash
# Liveness (is server running?)
curl http://localhost:3000/api/health

# Readiness (can handle requests?)
curl http://localhost:3000/api/health?type=ready
```

### Logs

```bash
# Docker Compose
docker-compose logs -f app

# Docker
docker logs -f buildwise-app

# Kubernetes
kubectl logs -f deployment/buildwise -n buildwise
```

### Metrics

Add monitoring with:
- **Prometheus** + Grafana (metrics)
- **Sentry** (error tracking)
- **DataDog** (APM)
- **New Relic** (all-in-one)

---

## Backup Strategy

### MongoDB Backups

```bash
# Manual backup
docker exec buildwise-mongodb mongodump --out /backup

# Restore
docker exec buildwise-mongodb mongorestore /backup

# Automated (cron job)
0 2 * * * docker exec buildwise-mongodb mongodump --out /backup/$(date +\%Y\%m\%d)
```

### File Backups

```bash
# Backup uploaded files/data
tar -czf backup-$(date +\%Y\%m\%d).tar.gz ./data ./uploads
```

---

## Performance Optimization

### 1. Database Indexing

```javascript
// MongoDB indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.projects.createIndex({ userId: 1, created_at: -1 });
```

### 2. Caching

```bash
# Add Redis for session/cache
docker run -d -p 6379:6379 --name buildwise-redis redis:alpine
```

### 3. CDN Setup

- Use Vercel Edge Network (automatic with Vercel)
- Or CloudFlare for static assets
- Enable Next.js Image Optimization

### 4. Database Connection Pooling

Already configured in Prisma and Mongoose.

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker-compose logs app

# Check environment variables
docker-compose config

# Rebuild
docker-compose build --no-cache
docker-compose up -d
```

### Database connection failed

```bash
# Check MongoDB is running
docker ps | grep mongo

# Test connection
docker exec -it buildwise-mongodb mongosh

# Check connection string format
echo $MONGODB_URI
```

### Out of memory

```bash
# Increase Node.js memory
NODE_OPTIONS="--max-old-space-size=2048" npm start

# Or in Dockerfile
ENV NODE_OPTIONS="--max-old-space-size=2048"
```

---

## Scaling

### Horizontal Scaling

```bash
# Docker Compose - scale replicas
docker-compose up -d --scale app=3

# Kubernetes - scale deployment
kubectl scale deployment buildwise --replicas=5 -n buildwise

# Add load balancer (nginx, traefik, etc.)
```

### Vertical Scaling

Update resource limits in docker-compose.yml:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G
```

---

## CI/CD Pipeline

### GitHub Actions Example

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build and push Docker image
        run: |
          docker build -t buildwise:${{ github.sha }} .
          docker push your-registry/buildwise:${{ github.sha }}
      - name: Deploy to production
        run: |
          # Your deployment commands
```

---

## Support

For issues or questions:
- GitHub Issues: [your-repo]/issues
- Documentation: [your-docs-url]
- Email: support@buildwise.com
