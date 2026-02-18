# 🚀 Quick Start - Deploy in 5 Minutes

## Prerequisites
- Docker & Docker Compose installed
- Terminal/PowerShell access

## Step 1: Setup Environment (1 min)

```powershell
# Copy environment template
copy .env.example .env.local

# Generate secure JWT secret (run in PowerShell)
# Copy the output and paste into .env.local as JWT_SECRET
$bytes = New-Object Byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Generate MongoDB password
$bytes = New-Object Byte[] 24
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Edit `.env.local`:
```bash
JWT_SECRET=<paste-generated-secret-here>
MONGO_PASSWORD=<paste-generated-password-here>
MONGODB_URI=mongodb://buildwise:<MONGO_PASSWORD>@mongodb:27017/buildwise?authSource=admin
SETUP_MODE=true
SETUP_SECRET=temporary-secret-123
```

## Step 2: Build & Start (2 min)

```powershell
# Build and start all services
docker-compose up -d

# Watch logs (Ctrl+C to stop watching)
docker-compose logs -f app
```

Wait for: `✓ Ready in Xms` message

## Step 3: Verify Health (30 sec)

```powershell
# Check if server is running
curl http://localhost:3000/api/health

# Expected output:
# {"status":"ok","timestamp":"...","uptime":...}
```

## Step 4: Create Admin User (1 min)

### Option A: Via UI
1. Open browser: http://localhost:3000
2. Click "Register"
3. Fill form with your details
4. Click "Register"

### Option B: Via API
```powershell
# Register user
curl -X POST http://localhost:3000/api/auth/register `
  -H "Content-Type: application/json" `
  -d '{"name":"Admin User","email":"admin@buildwise.com","password":"SecurePass123"}'

# Response: {"user":{...},"token":"..."}
```

### Promote to Admin
```powershell
curl -X POST http://localhost:3000/api/setup/promote-admin `
  -H "Content-Type: application/json" `
  -d '{"email":"admin@buildwise.com","secret":"temporary-secret-123"}'

# Response: {"success":true,"message":"User ... is now an admin"}
```

## Step 5: Secure Setup (30 sec)

```powershell
# Edit .env.local and change:
# SETUP_MODE=false
# Remove SETUP_SECRET line

# Restart container
docker-compose restart app
```

---

## ✅ You're Done!

Your app is now running at: **http://localhost:3000**

### What's Deployed:
- ✅ Next.js app (localhost:3000)
- ✅ MongoDB database (localhost:27017)
- ✅ Health monitoring
- ✅ Secure authentication
- ✅ Validated inputs
- ✅ Docker containerization

---

## 🎯 Next Steps

### Immediate
1. Log in with your admin account
2. Explore the application
3. Create some test projects

### For Production
1. Change JWT_SECRET to production value
2. Update MONGODB_URI to production database
3. Set APP_URL to your domain
4. Review `DEPLOYMENT_GUIDE.md` for cloud deployment
5. Setup monitoring (Sentry, etc.)

---

## 🛠️ Common Commands

```powershell
# View logs
docker-compose logs -f app

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Stop and remove all data (⚠️ DESTRUCTIVE)
docker-compose down -v

# Rebuild after code changes
docker-compose build
docker-compose up -d

# Check running containers
docker-compose ps

# Access MongoDB shell
docker-compose exec mongodb mongosh -u buildwise -p <MONGO_PASSWORD>
```

---

## 🆘 Troubleshooting

### Port already in use
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (replace PID)
taskkill /PID <PID> /F

# Or change port in docker-compose.yml:
# ports:
#   - "3001:3000"  # Use 3001 instead
```

### Container won't start
```powershell
# Check logs for errors
docker-compose logs app

# Check environment variables
docker-compose config

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

### Can't connect to MongoDB
```powershell
# Check MongoDB is running
docker-compose ps mongodb

# Check MongoDB logs
docker-compose logs mongodb

# Verify connection string in .env.local
# Make sure password is URL-encoded if it contains special characters
```

### Health check failing
```powershell
# Check health endpoint
curl http://localhost:3000/api/health?type=ready

# If database error, check MongoDB:
docker-compose logs mongodb

# Restart services
docker-compose restart
```

---

## 📋 Pre-Flight Checklist

Before deploying to production, verify:

- [ ] `JWT_SECRET` is 32+ random characters
- [ ] `SETUP_MODE=false` in production
- [ ] `MONGO_PASSWORD` is strong and unique
- [ ] Database backups configured
- [ ] Monitoring setup (logs, errors, metrics)
- [ ] HTTPS/SSL configured (via reverse proxy)
- [ ] Domain name pointed to server
- [ ] Firewall rules configured
- [ ] Environment variables secured (not in git)

---

## 🎓 Understanding the Stack

### What's Running?

```
┌─────────────────────────────────────┐
│  Browser: http://localhost:3000     │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Next.js App Container              │
│  - API Routes                       │
│  - React Components                 │
│  - Authentication                   │
│  - Health Checks                    │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  MongoDB Container                  │
│  - User data                        │
│  - Projects                         │
│  - Sessions                         │
└─────────────────────────────────────┘
```

### Data Flow

1. **Request**: Browser → Next.js API route
2. **Auth**: JWT token validated
3. **Validation**: Input checked against schemas
4. **Database**: MongoDB query/update
5. **Response**: JSON back to browser

All communication happens within Docker network for security.

---

**Need Help?** Check `DEPLOYMENT_GUIDE.md` for comprehensive documentation.
