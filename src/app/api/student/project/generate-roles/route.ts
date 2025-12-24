// src/app/api/student/project/generate-roles/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { requireRoleOrThrow } from "@/lib/backend/auth";
import { v4 as uuidv4 } from "uuid";

// Learning resources curated by feature/role
const LEARNING_RESOURCES: Record<string, any[]> = {
  auth: [
    { title: "JWT Authentication Basics", url: "https://jwt.io/introduction" },
    { title: "Password Hashing (bcrypt)", url: "https://github.com/kelektiv/node.bcrypt.js" }
  ],
  payments: [
    { title: "Stripe Integration Guide", url: "https://stripe.com/docs/payments/quickstart" },
    { title: "Webhook Security", url: "https://stripe.com/docs/webhooks/signatures" }
  ],
  notifications: [
    { title: "Push Notifications (Firebase)", url: "https://firebase.google.com/docs/cloud-messaging" },
    { title: "Email with Nodemailer", url: "https://nodemailer.com/about/" }
  ],
  database: [
    { title: "MongoDB Schema Design", url: "https://www.mongodb.com/docs/manual/core/data-modeling-introduction/" },
    { title: "SQL vs NoSQL", url: "https://www.mongodb.com/nosql-explained/nosql-vs-sql" }
  ]
};

const ROLE_TEMPLATES: Record<string, any> = {
  backend: {
    title: "Backend Developer",
    description: "Implement APIs, DB models and integration logic",
    baseTasks: [
      { title: "Design database schema", milestone: "M1", nodeId: "n-database", details: "Define collections/tables, relationships, indexes" },
      { title: "Implement core APIs (auth, CRUD)", milestone: "M1", nodeId: "n-backend", details: "POST /auth/login, GET/POST/PUT/DELETE for main entities" },
      { title: "Write unit tests for API endpoints", milestone: "M2", nodeId: "n-backend", details: "Jest/Mocha tests with 80%+ coverage" }
    ]
  },
  frontend: {
    title: "Frontend Developer",
    description: "Create UI screens, connect APIs and handle state",
    baseTasks: [
      { title: "Create login & signup screens", milestone: "M1", nodeId: "n-frontend", details: "Form validation, error handling, redirect on success" },
      { title: "Create main list/detail UI for main feature", milestone: "M2", nodeId: "n-frontend", details: "Table/grid view + detail modal/page" },
      { title: "Connect to provided backend endpoints", milestone: "M2", nodeId: "n-frontend", details: "Fetch data, handle loading states, error boundaries" }
    ]
  },
  cloud: {
    title: "Cloud / DevOps",
    description: "Deploy the app and provide simple infra plan",
    baseTasks: [
      { title: "Create deployment scripts (Docker/Render)", milestone: "M3", nodeId: "n-backend", details: "Dockerfile, docker-compose.yml, CI/CD pipeline" },
      { title: "Provide simple cost estimate & scaling notes", milestone: "M3", nodeId: null, details: "Document expected traffic, costs, horizontal scaling plan" },
      { title: "Set up environment variables and DB connection", milestone: "M3", nodeId: "n-database", details: ".env.example, connection pooling, secrets management" }
    ]
  },
  docs: {
    title: "Documentation / QA",
    description: "Write README, project report and test plan",
    baseTasks: [
      { title: "Prepare developer README", milestone: "M3", nodeId: null, details: "Setup instructions, API docs, architecture diagram" },
      { title: "Write project report (architecture & decisions)", milestone: "M3", nodeId: null, details: "Tech stack rationale, trade-offs, future improvements" },
      { title: "Create manual test cases", milestone: "M3", nodeId: null, details: "User flows, edge cases, expected vs actual results" }
    ]
  }
};

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);
    await connectDB();

    const body = await req.json();
    const { projectId } = body;
    if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

    const project = await StudentProject.findById(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.userId.toString() !== user.userId && user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build milestones first
    const milestones = [
      { id: uuidv4(), title: "M1 - Basic auth and CRUD", description: "Login and main CRUD endpoints", done: false },
      { id: uuidv4(), title: "M2 - Frontend screens & integration", description: "UI integrated with APIs", done: false },
      { id: uuidv4(), title: "M3 - Final QA & Documentation", description: "Test cases and report", done: false },
    ];

    const features = project.selectedFeatures || [];
    
    // Build roles with milestone-linked tasks
    function buildRole(template: any, milestoneMap: any) {
      const tasks = template.baseTasks.map((t: any) => ({
        id: uuidv4(),
        title: t.title,
        description: t.details,
        nodeId: t.nodeId,
        milestoneId: milestoneMap[t.milestone],
        done: false
      }));

      const learning: any[] = [];
      return { id: uuidv4(), title: template.title, description: template.description, tasks, learning };
    }

    const milestoneMap = { M1: milestones[0].id, M2: milestones[1].id, M3: milestones[2].id };

    const roles: any[] = [];
    roles.push(buildRole(ROLE_TEMPLATES.backend, milestoneMap));
    roles.push(buildRole(ROLE_TEMPLATES.frontend, milestoneMap));
    roles.push(buildRole(ROLE_TEMPLATES.docs, milestoneMap));

    // Include cloud role for intermediate/advanced or if payments selected
    if (project.skillLevel !== "beginner" || features.includes("payments")) {
      roles.push(buildRole(ROLE_TEMPLATES.cloud, milestoneMap));
    }

    // Feature-aware task injection with learning resources
    if (features.includes("payments")) {
      const backend = roles.find(r => r.title === "Backend Developer");
      if (backend) {
        backend.tasks.push({
          id: uuidv4(),
          title: "Integrate payment provider (Stripe)",
          description: "POST /payment/checkout, handle webhooks, verify signatures",
          nodeId: "n-payment",
          milestoneId: milestones[1].id,
          done: false
        });
        backend.learning.push(...LEARNING_RESOURCES.payments);
      }
      const cloud = roles.find(r => r.title === "Cloud / DevOps");
      if (cloud) {
        cloud.tasks.push({
          id: uuidv4(),
          title: "Configure payment webhooks",
          description: "Set up webhook endpoint, secure with signature verification",
          nodeId: "n-payment",
          milestoneId: milestones[2].id,
          done: false
        });
      }
    }

    if (features.includes("notifications")) {
      const backend = roles.find(r => r.title === "Backend Developer");
      if (backend) {
        backend.tasks.push({
          id: uuidv4(),
          title: "Implement notification service",
          description: "POST /notify/send, queue jobs, retry logic",
          nodeId: "n-notify",
          milestoneId: milestones[1].id,
          done: false
        });
        backend.learning.push(...LEARNING_RESOURCES.notifications);
      }
      const frontend = roles.find(r => r.title === "Frontend Developer");
      if (frontend) {
        frontend.tasks.push({
          id: uuidv4(),
          title: "Integrate notification handlers (push/email)",
          description: "Service worker for push, display toast/banner",
          nodeId: "n-notify",
          milestoneId: milestones[1].id,
          done: false
        });
      }
    }

    if (features.includes("auth")) {
      const backend = roles.find(r => r.title === "Backend Developer");
      if (backend) {
        backend.learning.push(...LEARNING_RESOURCES.auth);
      }
    }

    // Add database learning resources
    const backend = roles.find(r => r.title === "Backend Developer");
    if (backend) {
      backend.learning.push(...LEARNING_RESOURCES.database);
    }

    // Write back roles + milestones
    project.roles = roles;
    project.milestones = milestones;
    await project.save();

    return NextResponse.json({ ok: true, roles: project.roles, milestones: project.milestones });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message || "Server error" }, { status: error.status || 500 });
  }
}
