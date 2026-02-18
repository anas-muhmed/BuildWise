# 📋 PRE-DEPLOYMENT CHECKLIST

## ✅ Before You Deploy - Complete These Steps

### 🔐 **SECURITY (CRITICAL)**

- [ ] **Generate Production Secrets**
  ```bash
  node generate-secrets.js
  ```
  - Save output in password manager
  - Use these in production .env (NOT in your local .env)

- [ ] **Update Production Environment File**
  - Copy `.env.production.example` to `.env.production` on VPS
  - Fill in generated secrets
  - Set APP_URL to your domain  
  - Ensure SETUP_MODE=false

- [ ] **Verify .gitignore**
  - ✅ `.env*` is listed (already done!)
  - Never commit secrets to GitHub

- [ ] **Test Authentication Locally**
  ```bash
  # Try registering a user
  curl -X POST http://localhost:3000/api/auth/register \
    -H "Content-Type: application/json" \
    -d '{"name":"Test","email":"test@test.com","password":"Test123!"}'
  
  # Try logging in
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"Test123!"}'
  ```

---

### 📦 **DOCKER (REQUIRED)**

- [ ] **Docker Images Built**
  ```bash
  docker compose build
  ```

- [ ] **Containers Running Locally**
  ```bash
  docker compose up
  # Visit http://localhost:3000
  ```

- [ ] **Health Checks Passing**
  ```bash
  curl http://localhost:3000/api/health
  # Should return: {"status":"ok"}
  ```

---

### 🌐 **DEPLOYMENT PREP**

- [ ] **Choose VPS Provider**
  - DigitalOcean / Linode / AWS / Oracle Cloud
  - Minimum: 1GB RAM, 1 CPU
  - Ubuntu 22.04 LTS recommended

- [ ] **Domain Name (Optional but Recommended)**
  - Purchase domain or use subdomain
  - Point DNS to VPS IP

- [ ] **Backup Strategy**
  - Plan MongoDB backup schedule
  - Decide where to store backups

---

### 📝 **CODE QUALITY**

- [ ] **Remove Console.logs**
  ```bash
  # Search for debug logs
  grep -r "console.log" src/
  ```

- [ ] **Check for Hardcoded Secrets**
  ```bash
  # Make sure no secrets in code
  grep -r "password" src/ --exclude="*.md"
  ```

- [ ] **Update docker-compose.yml**
  - Ensure using secrets (${MONGO_PASSWORD})
  - Not hardcoded values

---

## 🚫 WHAT NOT TO DO

❌ Don't commit .env files to GitHub  
❌ Don't use weak passwords in production  
❌ Don't leave SETUP_MODE=true  
❌ Don't skip SSL certificate  
❌ Don't expose MongoDB port publicly (27017)  
❌ Don't run containers as root (already fixed!)  

---

## ✅ CURRENT STATUS

Based on our audit:

### Working ✅
- Docker setup with multi-stage build
- Authentication (login/register)
- Password hashing (bcrypt)
- JWT token generation
- MongoDB connection
- Health check endpoint
- .gitignore protecting secrets

### Need to Fix Before Deploy ⚠️
1. **Generate strong production secrets** (use generate-secrets.js)
2. **Test authentication flows** (register → login → access protected route)
3. **Verify no secrets in code** (grep for passwords/keys)
4. **Create first admin user strategy** (setup endpoint or manual DB)

### After Deploy 🚀
1. SSL Certificate (Let's Encrypt)
2. Firewall (UFW)
3. Nginx reverse proxy
4. CI/CD pipeline
5. Monitoring & logs

---

## 🎯 READY TO DEPLOY?

You're ready when ALL boxes above are checked ✅

Current readiness: **70%**

**Next steps:**
1. Test authentication locally
2. Generate production secrets
3. Then we'll deploy to VPS!
