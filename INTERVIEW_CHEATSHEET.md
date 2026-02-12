# BuildWise Interview Cheat Sheet (Beginner‑Friendly)

## 1) One‑line summary
BuildWise is a **Next.js web app** that helps students/designers **plan software systems**, visualize architecture, and generate learning‑focused insights. It includes a **Student Mode** learning flow and a **Generative AI** workflow (currently mocked).

## 2) What problem does it solve?
- Turns vague project ideas into **structured plans**.
- Visualizes system architecture using an interactive canvas.
- Helps students explain their design decisions for exams/viva.

## 3) Who uses it?
- **Students**: step‑by‑step learning flow (Student Mode).
- **Teachers/Admins**: review submissions and feedback.
- **Builders**: generate proposals and architecture drafts.

## 4) Main features (simple)
- **Student Mode**: 7 guided steps from setup to summary.
- **Generative AI flow**: requirements → proposal → modules → finalize.
- **Architecture snapshots**: versioning and rollback.
- **Score/explanations**: rationale for nodes/edges on the canvas.
- **Mock AI**: AI responses are currently mocked for testing.

## 5) Tech stack (easy to remember)
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript.
- **Styling**: Tailwind CSS + small UI components.
- **Backend**: Next.js Route Handlers (API routes).
- **Database**: **MongoDB with Mongoose** (primary). Prisma + SQLite appear in repo for experimentation/local use.
- **Auth**: JWT‑based auth helpers.

## 6) Key folders (mental map)
- **UI Pages**: src/app/** (routes and screens)
- **API**: src/app/api/** (REST‑style route handlers)
- **Shared UI**: src/components/**
- **Backend logic**: src/lib/backend/**
- **Student Mode components**: src/components/student‑mode/**
- **Generative AI v2 components**: src/components/generative‑ai‑v2/**

## 7) Student Mode flow (7 steps)
1. Setup
2. Define
3. Reasoning
4. Canvas
5. Team
6. Cost
7. Summary

Each page has exactly **one job**, so students don’t get overwhelmed.

## 8) Generative AI flow (high‑level)
1. User submits requirements
2. Proposal is generated (currently mock)
3. Modules are suggested and approved
4. Snapshot is saved
5. Finalize page shows readiness + cost

## 9) Important data objects (simplified)
- **DraftProject.requirements**: stores intake answers
- **ArchitectureSnapshot**: saved nodes/edges/modules
- **Score + explanations**: used in Student Mode canvas

## 10) Current AI status (important!)
- AI is **NOT connected to OpenAI yet**
- It uses **mock responses** in the mock AI route and wrapper

## 11) Typical interview questions (with short answers)
**Q: What is BuildWise?**  
A: A Next.js app to help students design and explain software architecture.

**Q: What is Student Mode?**  
A: A 7‑step guided flow that teaches architecture decisions.

**Q: Where is the backend?**  
A: Next.js API routes in src/app/api, with logic in src/lib/backend.

**Q: What database does it use?**  
A: MongoDB with Mongoose (primary). There’s also Prisma/SQLite in the repo.

**Q: Is AI real or mock?**  
A: Currently mock. The wrapper is ready for real provider integration.

**Q: How are versions saved?**  
A: Architecture snapshots are stored and can be rolled back.

## 12) Docker (planned / future‑ready)
When Dockerizing later, the usual setup will include:
- **Dockerfile** for the Next.js app
- **docker-compose.yml** to run:
  - App container
  - MongoDB container
- Environment variables for DB connection and JWT secrets
- Volume for MongoDB data persistence

Expected flow in Docker:
1. App container starts Next.js server
2. MongoDB container runs and stores project data
3. App reads DB URI from env variables

## 13) Simple “talk track” (30 seconds)
“BuildWise is a Next.js app that guides students through architecture design. It has a Student Mode with 7 steps and a Generative AI workflow for proposals and modules. The backend uses Next.js API routes with MongoDB/Mongoose. AI responses are mocked right now, but the architecture is ready for real AI integration. We plan to Dockerize it with separate app and database containers.”

---
If you want, I can also add a **one‑page diagram** or a **glossary** for non‑technical teammates.
