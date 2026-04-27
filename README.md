<div align="center">

# BuildWise

**An AI-powered EdTech platform for learning system design — interactively.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-buildwise--dev.me-4CAF50?style=for-the-badge&logo=vercel&logoColor=white)](https://buildwise-dev.me)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4-412991?style=for-the-badge&logo=openai&logoColor=white)](https://openai.com)

</div>

---

> 📸 **Screenshot / Demo GIF**
> `![BuildWise Demo](./assets/demo.gif)`

---

## What It Does

BuildWise is a platform where developers learn system design by **doing it** — not just reading about it.

Users design system architectures visually, then an AI evaluator gives structured feedback: what's correct, what's missing, and why it matters at scale. Think of it as a feedback loop between your design decisions and production-grade system design principles.

Built as a major college recognition project. Live at [buildwise-dev.me](https://buildwise-dev.me).

---

## Core Features

**Visual Architecture Builder** — users construct system designs using a JSON-based component model with 26 components across 7 categories (load balancers, databases, caches, queues, etc.). Each component has defined properties and connection rules.

**AI Evaluation Pipeline** — submitted designs pass through a structured 5-layer pipeline: context normalization → prompt templating → OpenAI API call → JSON schema validation → mock fallback. Returns categorized feedback: scores, strengths, gaps, and improvement suggestions.

**Student Mode** — an interactive guided mode where the platform asks requirement questions, builds a context from the answers, then generates and scores an architecture based on those constraints.

**Role-Based Access Control (RBAC)** — two roles: `User` and `Admin`. Admins can view AI usage logs, manage content, and control platform state. Enforced at middleware level on every protected route.

**AI Observability** — every OpenAI request is logged with user ID, project ID, token usage, and timestamp. Admin dashboard surfaces this data for cost tracking and audit trails.

---

## Architecture

```
Browser (React / Next.js App Router)
        │
        ▼
Next.js API Routes  (collocated backend)
        │
        ├──► MongoDB          (users, designs, AI logs)
        └──► OpenAI API       (AI evaluation pipeline)

DigitalOcean VPS
  └── Docker Compose
        ├── app container     (Next.js, port 3000)
        ├── mongodb container
        └── Nginx             (reverse proxy + SSL termination)
```

**AI service follows strict layered separation:**
- `Context Builders` → translate user input into English narratives (enum compression)
- `Prompt Templates` → inject context into structured prompts
- `OpenAI Provider` → single callsite, configurable per-endpoint token budgets
- `Schema Validators` → AJV validates every AI response before it reaches the client
- `Mock Layer` → deterministic fallback for dev mode and AI failures

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React (Next.js App Router), TypeScript |
| Backend | Next.js API Routes, TypeScript |
| Database | MongoDB (Mongoose ODM) |
| AI Integration | OpenAI API (GPT-4), structured prompt pipeline |
| Auth | JWT + RBAC middleware |
| Containerization | Docker, Docker Compose |
| Reverse Proxy | Nginx + SSL (Let's Encrypt) |
| Deployment | DigitalOcean VPS |
| CI/CD | GitHub Actions |

---

## Key Technical Decisions

**JSON-based architecture model** — component definitions are stored as structured JSON, making designs serializable, storable in MongoDB, and parseable by the AI prompt without any image processing.

**Multi-layer AI service** — OpenAI calls are isolated behind a `callOpenAI` provider. Context builders, prompt templates, and validators are separate modules. Swapping GPT-4 for a fine-tuned model or a different provider requires touching one file.

**Graceful degradation** — a `USE_REAL_AI` feature flag controls mock vs. real AI. When real AI fails, the system falls back to deterministic mock responses automatically — zero downtime during API outages.

**Per-endpoint token budgets** — each AI endpoint has an explicit `max_tokens` limit tuned to its output complexity (1000 for scoring, 3500 for proposals, 1200 for manual design). Prevents cost overruns without a hard global cap.

**AJV schema validation on AI responses** — every OpenAI response is parsed and validated against a JSON schema before it reaches the client. Malformed or hallucinated responses are caught server-side and handled gracefully.

**RBAC at middleware level** — role verification happens before any route handler executes. Admin routes are completely inaccessible to User-role tokens regardless of the request payload.

**Sliding-window rate limiter** — in-memory rate limiter with per-endpoint configs (e.g. 10 req/min for expensive generative endpoints, 30 req/min for lightweight ones). Designed to drop in Redis for distributed rate limiting in production.

**Docker Compose for multi-container orchestration** — `app`, `mongodb`, and `nginx` run as separate containers. Nginx handles SSL termination and proxies to the app container by service name.

---

## Local Setup

### Prerequisites
- Node.js 18+
- Docker + Docker Compose
- MongoDB connection string (Atlas free tier works)
- OpenAI API key (optional — mock mode works without it)

### Run with Docker

```bash
git clone https://github.com/anas-muhmed/BuildWise.git
cd BuildWise
cp .env.example .env        # fill in your credentials
docker-compose up --build
```

App runs at `http://localhost:3000`

### Run without Docker

```bash
npm install
cp .env.example .env        # fill in MONGODB_URI and JWT_SECRET at minimum
npm run dev
```

### Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_min_32_chars
OPENAI_API_KEY=sk-...       # optional — set USE_REAL_AI=false to skip
USE_REAL_AI=false            # true = real OpenAI, false = mock responses
NODE_ENV=development
APP_URL=http://localhost:3000
```

> The `.env.example` file is the authoritative list of all required and optional variables.

---

## Project Structure

```
BuildWise/
├── src/
│   ├── app/
│   │   ├── api/                        # Next.js API routes (collocated backend)
│   │   │   ├── auth/                   # JWT login, register, session
│   │   │   ├── admin/                  # Admin dashboard, AI usage logs, audit
│   │   │   ├── generative/             # AI architecture generation (phased)
│   │   │   ├── student-mode/           # Interactive learning mode endpoints
│   │   │   └── design/                 # Design CRUD + snapshot/rollback
│   │   └── (pages)/                    # Next.js page routes
│   ├── components/                     # React UI components
│   ├── lib/
│   │   └── backend/
│   │       ├── ai/
│   │       │   ├── context/            # Context builders (input → English)
│   │       │   ├── prompts/            # Prompt templates per feature
│   │       │   ├── validators/         # AJV schema validators for AI responses
│   │       │   ├── mocks/              # Deterministic mock responses
│   │       │   ├── openaiProvider.ts   # Single OpenAI callsite
│   │       │   ├── rateLimiter.ts      # Sliding-window rate limiter
│   │       │   └── config.ts           # Feature flags + token budgets
│   │       ├── models/                 # Mongoose schemas
│   │       └── authMiddleware.ts       # JWT + RBAC enforcement
│   └── hooks/                          # React custom hooks
├── .github/workflows/
│   └── deploy.yml                      # CI/CD: build validate → SSH deploy
├── docker-compose.yml
├── nginx.conf                          # Nginx reverse proxy + SSL config
├── Dockerfile
└── .env.example
```

---

## CI/CD Pipeline

```
Push to master
  → GitHub Actions: npm install + npm run build (validates TypeScript + Next.js)
  → SSH into DigitalOcean VPS
  → git pull + inject secrets from GitHub Secrets into .env
  → docker-compose build --no-cache
  → docker-compose down && docker-compose up -d
```

SSL is managed via Let's Encrypt (Certbot), renewed automatically via cron on the VPS.

---

## Live Demo

🌐 **[Visit BuildWise → buildwise-dev.me](https://buildwise-dev.me)**

---

<div align="center">

Built by [Anas](https://github.com/anas-muhmed) · [LinkedIn](https://www.linkedin.com/in/anas-muhmed)

</div>
