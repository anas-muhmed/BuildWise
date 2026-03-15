# 🎯 Deployment Interview Cheat Sheet
### BCA Fresher | First Internship/Job
### Topics: VPS → Docker → Nginx → HTTPS

---

## 📦 SECTION 1: Cloud & VPS Basics

---

**Q1: What is a VPS? How is it different from shared hosting?**

> **A:** VPS (Virtual Private Server) is a dedicated slice of a physical server in the cloud. You get your own CPU, RAM, storage, and full root access.
>
> | Shared Hosting | VPS |
> |---|---|
> | Everyone shares same server | You get dedicated resources |
> | No root access | Full root (admin) access |
> | Host manages everything | You manage everything |
> | Like renting a bed in dorm | Like renting your own apartment |
>
> In my project I used DigitalOcean VPS (called Droplet) — 2GB RAM, 50GB SSD, Ubuntu 24.04.

---

**Q2: What is DigitalOcean? Why did you choose it?**

> **A:** DigitalOcean is a cloud provider (like AWS but simpler). Their VPS is called a "Droplet".
>
> I chose it because:
> - Simple dashboard, beginner-friendly
> - $12/month for production-ready server
> - Bangalore region (low latency for Indian users)
> - Good documentation

---

**Q3: What is an IP address? What is a domain name?**

> **A:**
> - **IP Address** = Numeric address of your server. Example: `159.65.152.192`
> - **Domain name** = Human-readable alias for that IP. Example: `buildwise-dev.me`
> - **DNS** = Translates domain → IP (like a phonebook)
>
> When someone types `buildwise-dev.me`, DNS says "that's 159.65.152.192" and connects there.

---

**Q4: How did you connect your domain to your server?**

> **A:** I bought the domain from Namecheap. In their DNS settings, I added an **A Record**:
> - Type: A
> - Host: @
> - Value: 159.65.152.192 (my Droplet IP)
>
> After 5-30 minutes (DNS propagation), `buildwise-dev.me` started pointing to my server.

---

**Q5: What is SSH? How did you access your server?**

> **A:** SSH (Secure Shell) is a protocol to remotely control a Linux server via terminal. It's like TeamViewer but only command-line.
>
> To connect:
> ```bash
> ssh root@159.65.152.192
> ```
> - `root` = admin user on Linux
> - `159.65.152.192` = server IP
>
> Authentication is via SSH key pair (public key on server, private key on my laptop).

---

## 🐳 SECTION 2: Docker & Containerization

---

**Q6: What is Docker? Why did you use it?**

> **A:** Docker packages your application with all its dependencies into a **container** — an isolated, portable environment that runs the same everywhere.
>
> Without Docker:
> - "Works on my machine" problem
> - Manual installation of Node.js, MongoDB, etc.
> - Version conflicts
>
> With Docker:
> - One command to start everything
> - Same behavior on laptop, server, anywhere
> - Each service isolated
>
> In BuildWise: Docker runs Next.js app + MongoDB as separate containers.

---

**Q7: What is the difference between a Docker Image and a Docker Container?**

> **A:**
> - **Image** = Blueprint/recipe (like a class in OOP)
> - **Container** = Running instance of that image (like an object)
>
> Example:
> ```
> node:20-alpine image → You can run 10 containers from it
> ```
>
> In BuildWise:
> - `buildwise-app` image → `buildwise-app` container (running)
> - `mongo:4.4` image → `buildwise-mongodb` container (running)

---

**Q8: What is a Dockerfile?**

> **A:** A Dockerfile is a script that tells Docker HOW to build your image. Step by step instructions.
>
> My BuildWise Dockerfile:
> ```dockerfile
> FROM node:20-alpine     # Start with Node.js base image
> WORKDIR /app            # Working directory inside container
> COPY package.json ./    # Copy package files
> RUN npm install         # Install dependencies
> COPY . .                # Copy all source code
> RUN npm run build       # Build Next.js
> CMD ["node", "server.js"] # Start the app
> ```
>
> Multi-stage build: I used 3 stages (deps, builder, runner) to keep final image small.

---

**Q9: What is Docker Compose? Why is it used?**

> **A:** Docker Compose lets you define and run **multiple containers** together using a single YAML file (`docker-compose.yml`).
>
> Instead of running 2 separate docker commands:
> ```bash
> docker run mongodb...
> docker run nextjs-app...
> ```
>
> Just one command:
> ```bash
> docker-compose up -d
> ```
>
> The `docker-compose.yml` defines all services, their ports, environment variables, networks, and volumes in one place.

---

**Q10: Explain Docker port mapping. What does "80:3000" mean?**

> **A:** Port mapping connects external server ports to internal container ports.
>
> Syntax: `"EXTERNAL:INTERNAL"`
>
> ```yaml
> ports:
>   - "80:3000"
> ```
>
> - **Left (80):** Port on the actual server (what the world connects to)
> - **Right (3000):** Port inside the container (where Next.js runs)
>
> So when someone connects to server port 80, Docker forwards it to container port 3000.
>
> **Port 80** is special — browsers add it automatically for HTTP, so you don't need to type `:80` in URL.

---

**Q11: What are Docker volumes? Why are they important?**

> **A:** Volumes store data **outside** the container so data persists even when container restarts or is deleted.
>
> Without volumes: MongoDB data is deleted when container stops ❌
> With volumes: Data saved on server disk, survives restarts ✅
>
> In BuildWise:
> ```yaml
> volumes:
>   - mongodb_data:/data/db  # MongoDB data stored here
>   - app_data:/app/data     # App data stored here
> ```

---

**Q12: What is the difference between `docker-compose up` and `docker-compose up -d`?**

> **A:**
> - `docker-compose up` → Starts containers, logs appear in terminal (blocking). Stop with Ctrl+C stops containers too.
> - `docker-compose up -d` → Starts in **detached mode** (background). Terminal returns immediately. Containers keep running even after you close terminal.
>
> Always use `-d` in production.

---

**Q13: How do you check if your Docker containers are running?**

> **A:**
> ```bash
> docker-compose ps          # See all containers and their status
> docker-compose logs app    # See logs of app container
> docker-compose logs -f app # Follow logs in real time (like tail -f)
> docker ps                  # All running containers on server
> ```
>
> Healthy output shows `Up` in State column.

---

## 🌐 SECTION 3: Networking & Ports

---

**Q14: What are ports? Name some commonly used ports.**

> **A:** Ports are numbered doors on a server. Each service listens on a different port.
>
> | Port | Service |
> |------|---------|
> | 22 | SSH (server management) |
> | 80 | HTTP (web, unencrypted) |
> | 443 | HTTPS (web, encrypted) |
> | 3000 | Node.js/Next.js (default) |
> | 27017 | MongoDB |
> | 5432 | PostgreSQL |
> | 3306 | MySQL |

---

**Q15: What is a firewall? How did you configure it?**

> **A:** A firewall controls which ports are open/closed to the internet. Like a security guard that only lets specific traffic in.
>
> I used **UFW (Uncomplicated Firewall)** on Ubuntu:
> ```bash
> ufw allow 22/tcp    # SSH - MUST allow FIRST or you lock yourself out!
> ufw allow 80/tcp    # HTTP
> ufw allow 443/tcp   # HTTPS
> ufw --force enable  # Turn on firewall
> ```
>
> ⚠️ Critical lesson: Always allow port 22 BEFORE enabling UFW. Otherwise you permanently lock yourself out.

---

**Q16: What is a reverse proxy? Why did you use Nginx as one?**

> **A:** A reverse proxy sits in front of your application and forwards requests to it.
>
> ```
> Internet → Nginx (port 80/443) → BuildWise App (port 3000)
> ```
>
> Benefits:
> - Handles SSL/HTTPS termination
> - Can serve multiple apps on same server
> - Load balancing capability
> - Hides internal port from public
> - Security layer between internet and app
>
> My Nginx config forwards all traffic from port 80/443 to BuildWise on 127.0.0.1:3000.

---

**Q17: What is 127.0.0.1? Why did you use it?**

> **A:** `127.0.0.1` is the **loopback address** (also called `localhost`). It means "this machine itself."
>
> By binding Docker to `127.0.0.1:3000`, the BuildWise app is only accessible from within the server — NOT from the internet directly.
>
> Only Nginx (running on the same server) can reach it via `127.0.0.1:3000`.
>
> This is a security best practice: external users MUST go through Nginx, which handles authentication and SSL.

---

## 🔒 SECTION 4: HTTPS & SSL Certificates

---

**Q18: What is the difference between HTTP and HTTPS?**

> **A:**
>
> | HTTP | HTTPS |
> |------|-------|
> | Data travels in plain text | Data is encrypted |
> | Port 80 | Port 443 |
> | Browser shows "Not Secure" ⚠️ | Browser shows padlock 🔒 |
> | Anyone can intercept data | Data unreadable if intercepted |
>
> HTTPS uses **TLS (Transport Layer Security)** to encrypt data between browser and server.

---

**Q19: What is an SSL/TLS certificate?**

> **A:** A digital certificate that:
> 1. **Proves identity:** "This is really buildwise-dev.me, not a fake"
> 2. **Enables encryption:** Contains public key for encrypting data
> 3. **Issued by CA:** Certificate Authority (trusted third party) like Let's Encrypt
>
> Without certificate → browser says "Not Secure" or blocks access.
> With certificate → browser shows green padlock 🔒.

---

**Q20: What is Let's Encrypt? Why did you use it?**

> **A:** Let's Encrypt is a non-profit Certificate Authority that provides **free SSL certificates**.
>
> - Free (vs paid certs that cost $50-200/year)
> - Valid for 90 days (auto-renews)
> - Trusted by all major browsers
> - Used by 300+ million websites
>
> I used **Certbot** (Let's Encrypt's tool) which automatically:
> - Gets the certificate
> - Configures Nginx for HTTPS
> - Sets up HTTP → HTTPS redirect
> - Schedules auto-renewal

---

**Q21: How does Certbot verify that you own the domain?**

> **A:** Certbot uses **HTTP-01 challenge**:
> 1. Certbot creates a temporary file on your server
> 2. Let's Encrypt tries to access that file via your domain (e.g., `buildwise-dev.me/.well-known/acme-challenge/...`)
> 3. If accessible, it proves YOU control that domain
> 4. Certificate is issued
>
> This is why domain must point to server before running certbot.

---

**Q22: What happens when someone visits http://buildwise-dev.me after SSL setup?**

> **A:** Nginx automatically redirects them to HTTPS:
>
> ```
> User types: http://buildwise-dev.me
>     ↓
> Server receives on port 80
>     ↓
> Nginx sends: 301 Moved Permanently
>              Location: https://buildwise-dev.me
>     ↓
> Browser automatically goes to https://
>     ↓
> User sees green padlock 🔒
> ```
>
> Certbot's `--redirect` flag sets this up automatically.

---

**Q23: Explain the full Nginx config you used.**

> **A:**
> ```nginx
> server {
>     listen 80;                        # Handle port 80 (HTTP)
>     server_name buildwise-dev.me;     # For this domain
>
>     location / {
>         proxy_pass http://127.0.0.1:3000;  # Forward to BuildWise
>         proxy_http_version 1.1;
>
>         # Pass real client info to app
>         proxy_set_header Host $host;
>         proxy_set_header X-Real-IP $remote_addr;
>         proxy_set_header X-Forwarded-Proto $scheme;
>
>         # WebSocket support
>         proxy_set_header Upgrade $http_upgrade;
>         proxy_set_header Connection "upgrade";
>     }
> }
> ```
> After certbot, it also added a `listen 443 ssl` block with certificate paths.

---

## 🚀 SECTION 5: CI/CD & Deployment Workflow

---

**Q24: What is CI/CD?**

> **A:**
> - **CI (Continuous Integration):** Automatically test and build code when you push to GitHub
> - **CD (Continuous Deployment):** Automatically deploy to server after successful build
>
> With CI/CD pipeline: `git push` → Tests run → Build → Deploy automatically
>
> Without CI/CD: Manually SSH → git pull → rebuild → restart (error-prone, slow)

---

**Q25: What is your deployment workflow for BuildWise?**

> **A:** My workflow:
> 1. Code changes locally in VS Code
> 2. `git push origin master` → pushes to GitHub
> 3. SSH into DigitalOcean server
> 4. `git pull origin master` → pulls latest code
> 5. `docker-compose build --no-cache` → rebuilds Docker image
> 6. `docker-compose down && docker-compose up -d` → restart with new code
> 7. `docker-compose logs app` → verify no errors

---

**Q26: What is the purpose of `docker-compose down` before `up`?**

> **A:** `down` stops and removes the OLD containers. Then `up -d` creates FRESH containers with the new image.
>
> If you just run `up -d` without `down`, Docker might use cached old containers.

---

## 🛠️ SECTION 6: Linux Basics (Common in Interviews)

---

**Q27: What Linux commands do you use regularly for server management?**

> **A:**
> ```bash
> # Navigation
> cd /root/buildwise    # Change directory
> ls -la                # List files with details
> pwd                   # Current directory
>
> # File editing
> nano filename         # Simple text editor
> cat filename          # View file contents
> grep "text" file      # Search in file
> sed -i 's/old/new/' file  # Find and replace in file
>
> # Process management
> systemctl status nginx    # Check service status
> systemctl restart nginx   # Restart service
> systemctl enable nginx    # Auto-start on reboot
>
> # System info
> df -h                 # Disk space
> free -h               # RAM usage
> top / htop            # Running processes
>
> # Networking
> curl -I https://site.com  # Check HTTP headers
> ping ip-address           # Test connectivity
> ufw status               # Firewall status
> ```

---

**Q28: What does `chmod` and `chown` do?**

> **A:**
> - `chmod` = Change file permissions (read/write/execute)
> - `chown` = Change file ownership (which user owns the file)
>
> Example: `chmod 600 .env` → Only owner can read/write .env (keep secrets safe!)

---

## 💡 SECTION 7: TIPS & TRICKS

---

### **🔥 Interview Tips**

**Tip 1: Always mention the "why"**
Don't just say "I used Docker." Say:
> "I used Docker because it ensures the app runs the same in development and production, eliminating environment-specific bugs."

**Tip 2: Mention mistakes you made and fixed**
Interviewers love this! Example:
> "Initially I enabled UFW firewall without allowing port 22 first, which locked me out permanently. I learned to always allow SSH before enabling the firewall."

**Tip 3: Know your numbers**
- Server: 2GB RAM, 50GB SSD, Ubuntu 24.04
- Certificate: 90-day validity, auto-renews
- Ping: ~18ms (Bangalore region)
- Build time: ~5 minutes Docker build

**Tip 4: Draw diagrams in your mind**
When explaining architecture:
```
Internet → Nginx → Docker App → MongoDB
  (443)    (proxy)   (3000)    (27017)
```

---

### **⚡ Technical Quick Tips**

**Tip 5: SSH timeout prevention**
Add to `~/.ssh/config` on your laptop:
```
Host buildwise-prod
    HostName 159.65.152.192
    User root
    ServerAliveInterval 60
```
Then just `ssh buildwise-prod` without timeout!

**Tip 6: View logs in real time**
```bash
docker-compose logs -f app    # Follow live logs
docker-compose logs --tail=50 app  # Last 50 lines only
```

**Tip 7: Quick server health check**
```bash
docker-compose ps              # Are containers up?
curl -I https://buildwise-dev.me  # Is site responding?
df -h                          # Is disk full?
free -h                        # Is RAM full?
```

**Tip 8: Never lose changes after reboot**
Always use:
```bash
systemctl enable nginx   # Nginx starts on reboot
systemctl enable docker  # Docker starts on reboot
docker-compose up -d     # Containers start on reboot via restart: unless-stopped
```

**Tip 9: Check certificate expiry**
```bash
certbot certificates
# Shows expiry date and days remaining
```

**Tip 10: Quick nginx debug**
```bash
nginx -t              # Test config syntax before reloading
nginx -s reload       # Reload config without downtime
tail -f /var/log/nginx/error.log  # Live error logs
```

---

### **🚫 Common Mistakes to Avoid**

| Mistake | Consequence | Fix |
|---------|-------------|-----|
| Enable UFW without allowing port 22 | Permanent lockout | Always `ufw allow 22` FIRST |
| Commit .env to GitHub | Secrets exposed publicly | Add `.env` to `.gitignore` |
| Not using `-d` in docker-compose up | App stops when terminal closes | Always use `docker-compose up -d` |
| Forgetting `docker-compose down` before rebuild | Old containers still running | Always `down` then `up -d` |
| Not checking `nginx -t` before restart | Breaks Nginx if config has errors | Always test config first |

---

### **📝 Fresher-Specific Advice**

**What to say when you don't know an answer:**
> "I haven't worked with that specific tool, but from my experience with [similar thing], I understand the concept. I'm confident I can learn it quickly."

**What interviewers test freshers on:**
1. Basic Linux commands (ls, cd, grep, chmod)
2. What is Docker / why use it
3. HTTP vs HTTPS difference
4. What is an API / REST API
5. Git commands (clone, push, pull)

**Your biggest advantage:**
You deployed a REAL production app with Docker + Nginx + SSL + Custom Domain. Most freshers only have localhost projects! Lead with this!

---

## 📋 Quick Reference Card (Memorize These)

```bash
# SSH into server
ssh root@159.65.152.192

# Check everything is running
cd /root/buildwise && docker-compose ps

# View app logs
docker-compose logs app | tail -30

# Restart app (after code changes)
git pull origin master
docker-compose build --no-cache
docker-compose down && docker-compose up -d

# Check HTTPS
curl -I https://buildwise-dev.me

# Check Nginx
systemctl status nginx
nginx -t

# Check SSL cert
certbot certificates

# Firewall status
ufw status numbered
```

---

*BuildWise Production: https://buildwise-dev.me | Server: 159.65.152.192 | Stack: Next.js + MongoDB + Docker + Nginx + Let's Encrypt*
