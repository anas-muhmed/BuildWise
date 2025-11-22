// src/app/api/student/project/generate-roles/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { v4 as uuidv4 } from "uuid";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ROLE_TEMPLATES: Record<string, any> = {
  backend: {
    title: "Backend Developer",
    description: "Implement APIs, DB models and integration logic",
    tasks: [
      "Design database schema",
      "Implement core APIs (auth, CRUD)",
      "Write unit tests for API endpoints"
    ]
  },
  frontend: {
    title: "Frontend Developer",
    description: "Create UI screens, connect APIs and handle state",
    tasks: [
      "Create login & signup screens",
      "Create main list/detail UI for main feature",
      "Connect to provided backend endpoints"
    ]
  },
  cloud: {
    title: "Cloud / DevOps",
    description: "Deploy the app and provide simple infra plan",
    tasks: [
      "Create deployment scripts (Docker/Render)",
      "Provide simple cost estimate & scaling notes",
      "Set up environment variables and DB connection"
    ]
  },
  docs: {
    title: "Documentation / QA",
    description: "Write README, project report and test plan",
    tasks: [
      "Prepare developer README",
      "Write project report (architecture & decisions)",
      "Create manual test cases"
    ]
  }
};

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const auth = getAuthUser(req as any);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  try {
    const body = await req.json();
    const { projectId } = body;
    if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });

    const project = await StudentProject.findById(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.userId.toString() !== auth.id) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const roles: any[] = [];
    // always include backend, frontend, docs
    roles.push({ id: uuidv4(), ...ROLE_TEMPLATES.backend });
    roles.push({ id: uuidv4(), ...ROLE_TEMPLATES.frontend });
    roles.push({ id: uuidv4(), ...ROLE_TEMPLATES.docs });

    // include cloud role for intermediate/advanced or if payments selected
    const features = project.selectedFeatures || [];
    if (project.skillLevel !== "beginner" || features.includes("payments")) {
      roles.push({ id: uuidv4(), ...ROLE_TEMPLATES.cloud });
    }

    // feature-aware injections
    if (features.includes("payments")) {
      const backend = roles.find(r => r.title === ROLE_TEMPLATES.backend.title);
      if (backend && !backend.tasks.includes("Integrate payment provider (checkout)")) {
        backend.tasks.push("Integrate payment provider (checkout)");
      }
      const cloud = roles.find(r => r.title === ROLE_TEMPLATES.cloud.title);
      if (cloud && !cloud.tasks.includes("Configure payment webhooks")) {
        cloud.tasks.push("Configure payment webhooks");
      }
    }
    if (features.includes("notifications")) {
      const frontend = roles.find(r => r.title === ROLE_TEMPLATES.frontend.title);
      if (frontend && !frontend.tasks.includes("Integrate notification handlers (push/email)")) {
        frontend.tasks.push("Integrate notification handlers (push/email)");
      }
      const docs = roles.find(r => r.title === ROLE_TEMPLATES.docs.title);
      if (docs) docs.tasks.push("Document notification workflow");
    }

    // write back roles + sample milestones
    project.roles = roles;
    project.milestones = [
      { id: uuidv4(), title: "M1 - Basic auth and CRUD", description: "Login and main CRUD endpoints", done: false },
      { id: uuidv4(), title: "M2 - Frontend screens & integration", description: "UI integrated with APIs", done: false },
      { id: uuidv4(), title: "M3 - Final QA & Documentation", description: "Test cases and report", done: false },
    ];
    await project.save();

    return NextResponse.json({ ok: true, roles: project.roles, milestones: project.milestones });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Server error" }, { status: 500 });
  }
}
