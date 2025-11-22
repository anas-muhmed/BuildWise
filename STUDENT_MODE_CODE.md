# 🎓 Student Mode Complete Code - Built on Nov 21, 2025

This document contains ALL the Student Mode code we built yesterday, from backend to frontend.

---

## 📁 Backend Models

### 1. StudentProject Model
**File:** `src/lib/backend/models/StudentProject.ts`

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IStudentProject extends Document {
  userId: mongoose.Types.ObjectId;
  appType: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  selectedFeatures: string[];
  steps: any[]; // Array of step objects
  architecture: {
    nodes: any[];
    edges: any[];
  };
  explanations: string[];
  aiScore?: number;
  status: "draft" | "submitted" | "verified" | "flagged" | "deleted";
  createdAt?: Date;
  updatedAt?: Date;
}

const StudentProjectSchema = new Schema<IStudentProject>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    appType: { type: String, required: true },
    skillLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    selectedFeatures: { type: [String], default: [] },
    steps: { type: Schema.Types.Mixed, default: [] },
    architecture: {
      type: {
        nodes: { type: [Schema.Types.Mixed], default: [] },
        edges: { type: [Schema.Types.Mixed], default: [] },
      },
      default: { nodes: [], edges: [] },
    },
    explanations: { type: [String], default: [] },
    aiScore: { type: Number, default: null },
    status: {
      type: String,
      enum: ["draft", "submitted", "verified", "flagged", "deleted"],
      default: "draft",
    },
  },
  { timestamps: true }
);

// Indexes for performance
StudentProjectSchema.index({ userId: 1, createdAt: -1 });
StudentProjectSchema.index({ status: 1 });

export const StudentProject =
  mongoose.models.StudentProject ||
  mongoose.model<IStudentProject>("StudentProject", StudentProjectSchema);
```

---

### 2. StudentSubmission Model
**File:** `src/lib/backend/models/StudentSubmission.ts`

```typescript
import mongoose, { Schema, Document } from "mongoose";

export interface IStudentSubmission extends Document {
  userId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  architecture: {
    nodes: any[];
    edges: any[];
  };
  notes: string;
  aiFeedback?: {
    score: number;
    suggestions: string[];
  };
  adminFeedback?: {
    adminId: mongoose.Types.ObjectId;
    note: string;
    createdAt: Date;
  };
  status: "pending" | "verified" | "flagged";
  createdAt?: Date;
  updatedAt?: Date;
}

const StudentSubmissionSchema = new Schema<IStudentSubmission>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: "StudentProject",
      required: true,
    },
    architecture: {
      type: {
        nodes: { type: [Schema.Types.Mixed], default: [] },
        edges: { type: [Schema.Types.Mixed], default: [] },
      },
      required: true,
    },
    notes: { type: String, default: "" },
    aiFeedback: {
      type: {
        score: Number,
        suggestions: [String],
      },
      default: null,
    },
    adminFeedback: {
      type: {
        adminId: Schema.Types.ObjectId,
        note: String,
        createdAt: Date,
      },
      default: null,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "flagged"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// Indexes
StudentSubmissionSchema.index({ userId: 1, createdAt: -1 });
StudentSubmissionSchema.index({ projectId: 1 });
StudentSubmissionSchema.index({ status: 1 });

export const StudentSubmission =
  mongoose.models.StudentSubmission ||
  mongoose.model<IStudentSubmission>(
    "StudentSubmission",
    StudentSubmissionSchema
  );
```

---

## 🤖 Mock Generator Logic

### 3. Mock Student Generator
**File:** `src/lib/mockStudentGenerator.ts`

```typescript
/**
 * Mock Student Architecture Generator
 * - Deterministic (not random) for consistent UX
 * - Generates architecture based on skill level
 * - Returns nodes, edges, explanations, and AI score
 */

type SkillLevel = "beginner" | "intermediate" | "advanced";

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
};

type Edge = {
  source: string;
  target: string;
};

type GeneratedArchitecture = {
  nodes: Node[];
  edges: Edge[];
  explanations: string[];
  aiScore: number;
};

export function generateMockArchitecture(
  appType: string,
  skillLevel: SkillLevel,
  step: number
): GeneratedArchitecture {
  const baseY = 100;
  const spacing = 150;

  if (skillLevel === "beginner") {
    // Simple 3-tier architecture
    if (step === 1) {
      return {
        nodes: [
          { id: "frontend", label: "Frontend (React)", x: 200, y: baseY },
        ],
        edges: [],
        explanations: [
          "Starting with the Frontend layer - this is what users see and interact with.",
          "React is a popular choice for building modern web interfaces.",
        ],
        aiScore: 20,
      };
    } else if (step === 2) {
      return {
        nodes: [
          { id: "frontend", label: "Frontend (React)", x: 200, y: baseY },
          {
            id: "backend",
            label: "Backend (Node.js)",
            x: 200,
            y: baseY + spacing,
          },
        ],
        edges: [{ source: "frontend", target: "backend" }],
        explanations: [
          "Added Backend layer - handles business logic and data processing.",
          "Node.js allows JavaScript on the server, making full-stack development easier.",
        ],
        aiScore: 50,
      };
    } else {
      return {
        nodes: [
          { id: "frontend", label: "Frontend (React)", x: 200, y: baseY },
          {
            id: "backend",
            label: "Backend (Node.js)",
            x: 200,
            y: baseY + spacing,
          },
          {
            id: "database",
            label: "Database (MongoDB)",
            x: 200,
            y: baseY + spacing * 2,
          },
        ],
        edges: [
          { source: "frontend", target: "backend" },
          { source: "backend", target: "database" },
        ],
        explanations: [
          "Completed with Database layer - stores all application data.",
          "MongoDB is a NoSQL database, great for flexible data structures.",
          "This 3-tier architecture is standard for most web applications.",
        ],
        aiScore: 85,
      };
    }
  } else if (skillLevel === "intermediate") {
    // 5-node architecture with services
    const baseNodes: Node[] = [
      { id: "cdn", label: "CDN (CloudFlare)", x: 100, y: baseY },
      { id: "frontend", label: "Frontend (React)", x: 250, y: baseY },
      {
        id: "api-gateway",
        label: "API Gateway",
        x: 250,
        y: baseY + spacing,
      },
      {
        id: "backend",
        label: "Backend Services",
        x: 250,
        y: baseY + spacing * 2,
      },
      {
        id: "database",
        label: "Database (PostgreSQL)",
        x: 250,
        y: baseY + spacing * 3,
      },
    ];

    const allEdges: Edge[] = [
      { source: "cdn", target: "frontend" },
      { source: "frontend", target: "api-gateway" },
      { source: "api-gateway", target: "backend" },
      { source: "backend", target: "database" },
    ];

    const nodesToShow = baseNodes.slice(0, step + 1);
    const edgesToShow = allEdges.slice(0, step);

    return {
      nodes: nodesToShow,
      edges: edgesToShow,
      explanations: [
        step === 1
          ? "CDN speeds up content delivery by caching static assets."
          : step === 2
          ? "API Gateway manages all incoming requests and routes them properly."
          : step === 3
          ? "Backend Services handle complex business logic in microservices."
          : "PostgreSQL provides robust relational data storage with ACID compliance.",
      ],
      aiScore: 20 + step * 15,
    };
  } else {
    // Advanced: 8-node microservices architecture
    const baseNodes: Node[] = [
      { id: "lb", label: "Load Balancer", x: 250, y: baseY },
      { id: "frontend", label: "Frontend", x: 150, y: baseY + spacing },
      { id: "api", label: "API Gateway", x: 350, y: baseY + spacing },
      {
        id: "auth",
        label: "Auth Service",
        x: 100,
        y: baseY + spacing * 2,
      },
      {
        id: "user",
        label: "User Service",
        x: 250,
        y: baseY + spacing * 2,
      },
      {
        id: "product",
        label: "Product Service",
        x: 400,
        y: baseY + spacing * 2,
      },
      { id: "cache", label: "Redis Cache", x: 150, y: baseY + spacing * 3 },
      { id: "db", label: "Database Cluster", x: 350, y: baseY + spacing * 3 },
    ];

    const allEdges: Edge[] = [
      { source: "lb", target: "frontend" },
      { source: "lb", target: "api" },
      { source: "api", target: "auth" },
      { source: "api", target: "user" },
      { source: "api", target: "product" },
      { source: "auth", target: "cache" },
      { source: "user", target: "db" },
      { source: "product", target: "db" },
    ];

    const nodesToShow = baseNodes.slice(0, Math.min(step + 1, 8));
    const edgesToShow = allEdges.slice(0, Math.min(step, 8));

    return {
      nodes: nodesToShow,
      edges: edgesToShow,
      explanations: [
        "Advanced microservices architecture with load balancing and caching.",
        "Each service is independent and can be scaled separately.",
        "Redis cache reduces database load for frequently accessed data.",
      ],
      aiScore: 15 + step * 10,
    };
  }
}
```

---

## 🌐 Backend API Routes

### 4. Create Student Project
**File:** `src/app/api/student/project/create/route.ts`

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function POST(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  try {
    const body = await req.json();
    const { appType, skillLevel } = body;

    if (!appType || !skillLevel) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const project = await StudentProject.create({
      userId: auth.id,
      appType,
      skillLevel,
      selectedFeatures: [],
      steps: [],
      architecture: { nodes: [], edges: [] },
      explanations: [],
      status: "draft",
    });

    return NextResponse.json({ projectId: project._id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
```

---

### 5. Update Project Features
**File:** `src/app/api/student/project/update-features/route.ts`

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function POST(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  try {
    const body = await req.json();
    const { projectId, selectedFeatures } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const project = await StudentProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId.toString() !== auth.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    project.selectedFeatures = selectedFeatures || [];
    await project.save();

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
```

---

### 6. Generate Architecture Step
**File:** `src/app/api/student/project/generate-step/route.ts`

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { generateMockArchitecture } from "@/lib/mockStudentGenerator";

export async function POST(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  try {
    const body = await req.json();
    const { projectId } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const project = await StudentProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId.toString() !== auth.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Generate next step
    const currentStep = project.steps.length + 1;
    const generated = generateMockArchitecture(
      project.appType,
      project.skillLevel,
      currentStep
    );

    // Add step to history
    project.steps.push({
      step: currentStep,
      title: `Step ${currentStep}`,
      nodes: generated.nodes,
      edges: generated.edges,
    });

    // Update current architecture (merge with existing)
    project.architecture.nodes = generated.nodes;
    project.architecture.edges = generated.edges;
    project.explanations = [
      ...project.explanations,
      ...generated.explanations,
    ];
    project.aiScore = generated.aiScore;

    await project.save();

    return NextResponse.json({
      step: currentStep,
      nodes: generated.nodes,
      edges: generated.edges,
      explanations: generated.explanations,
      aiScore: generated.aiScore,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
```

---

### 7. Submit Project for Review
**File:** `src/app/api/student/project/submit/route.ts`

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { StudentSubmission } from "@/lib/backend/models/StudentSubmission";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function POST(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  try {
    const body = await req.json();
    const { projectId, notes } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: "Missing projectId" },
        { status: 400 }
      );
    }

    const project = await StudentProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId.toString() !== auth.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update project status
    project.status = "submitted";
    await project.save();

    // Create submission record
    const submission = await StudentSubmission.create({
      userId: auth.id,
      projectId: project._id,
      architecture: project.architecture,
      notes: notes || "",
      aiFeedback: {
        score: project.aiScore || 0,
        suggestions: ["Good architecture design!", "Consider adding caching."],
      },
      status: "pending",
    });

    return NextResponse.json({ submissionId: submission._id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
```

---

### 8. Get Project by ID
**File:** `src/app/api/student/project/[id]/route.ts`

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  try {
    const project = await StudentProject.findById(params.id).lean();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId.toString() !== auth.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
```

---

### 9. List User's Projects
**File:** `src/app/api/student/projects/route.ts`

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  try {
    const projects = await StudentProject.find({ userId: auth.id })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ projects });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
```

---

## 🎨 Frontend Pages

### 10. Student Landing Page
**File:** `src/app/student/page.tsx`

```typescript
"use client";
import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavHeader from "@/components/NavHeader";

/**
 * Student Landing / Dashboard
 * - Lists StudentProjects for current user
 * - Shows statuses and quick actions (Continue / Submit / Create)
 * - Uses GET /api/student/projects (create this route if missing)
 *
 * Requires token in localStorage under "token".
 */

type Project = {
  _id: string;
  appType: string;
  skillLevel: string;
  selectedFeatures: string[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  architecture?: { nodes: any[]; edges: any[] };
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function StudentLandingContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch("/api/student/projects", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      setProjects(j.projects || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Student Mode</h1>
            <p className="text-sm text-slate-500">Your guided projects — draft, generate, submit.</p>
          </div>
          <div className="flex gap-2">
            <a href="/student/new">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">Start New Project</button>
            </a>
            <a href="/student/history">
              <button className="px-4 py-2 border rounded">My Projects</button>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <div className="bg-white rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-3">Recent Projects</h3>
              {loading && <div className="text-sm text-gray-500">Loading...</div>}
              {!loading && error && <div className="text-red-600">{error}</div>}
              {!loading && !error && projects.length === 0 && (
                <div className="text-sm text-gray-500">No projects yet. Click Start New Project.</div>
              )}
              {!loading && projects.length > 0 && (
                <ul className="space-y-3">
                  {projects.map((p) => (
                    <li key={p._id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <div className="font-medium">{p.appType.toUpperCase()} — {p.skillLevel}</div>
                        <div className="text-xs text-gray-500">Status: <span className="font-semibold">{p.status}</span> • Created: {p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}</div>
                      </div>
                      <div className="flex gap-2">
                        <a href={`/student/${p._id}`}>
                          <button className="px-3 py-1 border rounded">Continue</button>
                        </a>
                        <a href={`/student/${p._id}/review`}>
                          <button className="px-3 py-1 bg-indigo-600 text-white rounded">Review</button>
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col-span-4">
            <div className="bg-white rounded-xl p-4 shadow mb-4">
              <h4 className="font-semibold mb-2">Student Mode Preview</h4>
              <p className="text-sm text-slate-500 mb-3">Guided steps, simple explanations, AI feedback and admin review workflow.</p>
              <div className="w-full h-36 bg-gradient-to-br from-blue-50 to-indigo-100 rounded flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎓</div>
                  <div className="text-sm font-medium text-slate-700">Student Mode</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <h4 className="font-semibold mb-2">Tips</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>Generate one step at a time.</li>
                <li>Review AI suggestions before submitting.</li>
                <li>Submit only when ready — admin (you) will review.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentLanding() {
  return (
    <ProtectedRoute>
      <NavHeader />
      <StudentLandingContent />
    </ProtectedRoute>
  );
}
```

---

### 11. Create New Project Wizard
**File:** `src/app/student/new/page.tsx`

```typescript
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavHeader from "@/components/NavHeader";

/**
 * Student New Project Wizard
 * - Choose app type
 * - Choose feature checklist
 * - Choose skill level
 * - Start Project -> POST /api/student/project/create
 *
 * Notes:
 * - Expects auth token in localStorage as "token" (or change getToken)
 * - Uses the uploaded mock UI asset path (will be converted by your infra)
 */

type AppType = "ecommerce" | "notes" | "food" | "chat" | "attendance" | "task";
const APP_TYPES: { id: AppType; title: string; desc: string }[] = [
  { id: "ecommerce", title: "E-commerce", desc: "Products, cart, checkout" },
  { id: "notes", title: "Notes App", desc: "CRUD notes, tags" },
  { id: "food", title: "Food Delivery", desc: "Orders, locations" },
  { id: "chat", title: "Chat App", desc: "Real-time messaging" },
  { id: "attendance", title: "Attendance", desc: "Students, sessions" },
  { id: "task", title: "Task Manager", desc: "Tasks, projects" },
];

const FEATURE_OPTIONS: { id: string; label: string }[] = [
  { id: "auth", label: "Authentication (login/register)" },
  { id: "crud", label: "CRUD (create/read/update/delete)" },
  { id: "admin", label: "Admin Panel (basic)" },
  { id: "notifications", label: "Notifications (push/email)" },
  { id: "search", label: "Search & Filters" },
  { id: "payments", label: "Payment Integration" },
];

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function StudentNewProjectPageInner() {
  const router = useRouter();

  const [appType, setAppType] = useState<AppType>("ecommerce");
  const [skill, setSkill] = useState<"beginner"|"intermediate"|"advanced">("beginner");
  const [features, setFeatures] = useState<string[]>(["auth","crud"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  function toggleFeature(fid: string) {
    setFeatures((prev) =>
      prev.includes(fid) ? prev.filter((x) => x !== fid) : [...prev, fid]
    );
  }

  async function handleCreate() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch("/api/student/project/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ appType, skillLevel: skill }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create");

      const pid = json.projectId;
      setProjectId(pid);

      // Now update features
      const res2 = await fetch("/api/student/project/update-features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId: pid, selectedFeatures: features }),
      });
      const json2 = await res2.json();
      if (!res2.ok) throw new Error(json2?.error || "Failed to update features");

      // Redirect to editor
      router.push(`/student/${pid}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  if (projectId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🚀</div>
          <div className="text-lg font-semibold">Redirecting to your project...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold">Create New Project</h1>
          <p className="text-sm text-slate-500">Choose your app type, skill level, and features</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Left Column: Selections */}
          <div className="col-span-8">
            <div className="bg-white rounded-xl p-6 shadow mb-6">
              <h3 className="font-semibold mb-3">1. Choose App Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {APP_TYPES.map((at) => (
                  <button
                    key={at.id}
                    onClick={() => setAppType(at.id)}
                    className={`p-4 border-2 rounded-lg text-left transition ${
                      appType === at.id
                        ? "border-blue-600 bg-blue-50"
                        : "border-gray-200 hover:border-blue-300"
                    }`}
                  >
                    <div className="font-semibold">{at.title}</div>
                    <div className="text-xs text-gray-500">{at.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow mb-6">
              <h3 className="font-semibold mb-3">2. Choose Skill Level</h3>
              <div className="space-y-2">
                {["beginner", "intermediate", "advanced"].map((lvl) => (
                  <label key={lvl} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="skill"
                      checked={skill === lvl}
                      onChange={() => setSkill(lvl as typeof skill)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium capitalize">{lvl}</div>
                      <div className="text-xs text-gray-500">
                        {lvl === "beginner" ? "Simple 3-tier architecture" :
                         lvl === "intermediate" ? "5-node architecture with services" :
                         "Advanced microservices (8 nodes)"}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow mb-6">
              <h3 className="font-semibold mb-3">3. Select Features</h3>
              <div className="space-y-2">
                {FEATURE_OPTIONS.map((fo) => (
                  <label key={fo.id} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={features.includes(fo.id)}
                      onChange={() => toggleFeature(fo.id)}
                      className="w-4 h-4"
                    />
                    <div className="text-sm">{fo.label}</div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Project →"}
            </button>
          </div>

          {/* Right Column: Preview */}
          <div className="col-span-4">
            <div className="bg-white rounded-xl p-4 shadow sticky top-6">
              <h4 className="font-semibold mb-3">Preview</h4>
              <div className="space-y-2 text-sm">
                <div><strong>App:</strong> {APP_TYPES.find((a) => a.id === appType)?.title}</div>
                <div><strong>Level:</strong> {skill}</div>
                <div><strong>Features:</strong> {features.length} selected</div>
              </div>
              <div className="mt-4 p-3 bg-gradient-to-br from-blue-50 to-indigo-100 rounded">
                <div className="text-4xl mb-2">🎓</div>
                <div className="text-sm font-medium text-slate-700">Student Mode</div>
                <div className="text-xs text-slate-500">Guided Architecture Builder</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">UI preview placeholder</div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function StudentNewProjectPage() {
  return (
    <ProtectedRoute>
      <NavHeader />
      <StudentNewProjectPageInner />
    </ProtectedRoute>
  );
}
```

---

### 12. Project Editor with SVG Canvas
**File:** `src/app/student/[id]/page.tsx`

```typescript
"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavHeader from "@/components/NavHeader";

/**
 * Student Mode Editor Page
 * - Loads a StudentProject
 * - Renders architecture (nodes + edges)
 * - Generate Next Step (calls POST /api/student/project/generate-step)
 * - Submit Project for review (POST /api/student/project/submit)
 *
 * Notes:
 * - Expects auth token in localStorage key "token"
 * - Adjust API paths if your server route differs
 */

type Node = { id: string; label: string; x: number; y: number };
type Edge = { source: string; target: string };

type StudentProject = {
  _id: string;
  appType: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  selectedFeatures: string[];
  steps: { step: number; title: string; nodes: Node[]; edges: Edge[] }[];
  architecture: { nodes: Node[]; edges: Edge[] };
  explanations: string[];
  aiScore?: number | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function StudentProjectEditorInner() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const projectId = params?.id;

  const [project, setProject] = useState<StudentProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [typingText, setTypingText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);

  async function loadProject() {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`/api/student/project/${projectId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load");
      setProject(json.project);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // Typing animation for explanations
  const fullText = useMemo(() => {
    return (project?.explanations || []).join(" ");
  }, [project]);

  useEffect(() => {
    if (!fullText) return;
    if (typingIndex >= fullText.length) return;

    const timer = setTimeout(() => {
      setTypingText(fullText.slice(0, typingIndex + 1));
      setTypingIndex((prev) => prev + 1);
    }, 20);

    return () => clearTimeout(timer);
  }, [fullText, typingIndex]);

  async function handleGenerateStep() {
    if (!projectId) return;
    setGenerating(true);
    try {
      const token = getToken();
      const res = await fetch("/api/student/project/generate-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to generate");

      // Reload project
      await loadProject();
      setTypingIndex(0);
      setTypingText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit() {
    if (!projectId) return;
    if (!confirm("Submit project for admin review?")) return;

    setSubmitting(true);
    try {
      const token = getToken();
      const res = await fetch("/api/student/project/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, notes: "" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to submit");

      alert("Submitted successfully!");
      router.push("/student");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <div className="text-gray-600">Loading project...</div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">❌</div>
          <div className="text-red-600">{error || "Project not found"}</div>
          <button
            onClick={() => router.push("/student")}
            className="mt-4 px-4 py-2 border rounded"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  const nodes = project.architecture.nodes || [];
  const edges = project.architecture.edges || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold capitalize">
              {project.appType} Architecture
            </h1>
            <p className="text-sm text-slate-500">
              Skill Level: <span className="font-medium capitalize">{project.skillLevel}</span> •
              Steps: {project.steps.length} • AI Score: {project.aiScore || 0}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleGenerateStep}
              disabled={generating}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Next Step"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || nodes.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit for Review"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Canvas */}
          <div className="col-span-8">
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold mb-3">Architecture Canvas</h3>
              {nodes.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  No nodes yet. Click "Generate Next Step" to start building!
                </div>
              )}
              {nodes.length > 0 && (
                <svg width="100%" height="600" className="border rounded">
                  {/* Render edges first (lines) */}
                  {edges.map((edge, i) => {
                    const sourceNode = nodes.find((n) => n.id === edge.source);
                    const targetNode = nodes.find((n) => n.id === edge.target);
                    if (!sourceNode || !targetNode) return null;
                    return (
                      <line
                        key={i}
                        x1={sourceNode.x + 60}
                        y1={sourceNode.y + 30}
                        x2={targetNode.x + 60}
                        y2={targetNode.y + 30}
                        stroke="#3b82f6"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                    );
                  })}

                  {/* Arrow marker */}
                  <defs>
                    <marker
                      id="arrowhead"
                      markerWidth="10"
                      markerHeight="10"
                      refX="8"
                      refY="3"
                      orient="auto"
                      markerUnits="strokeWidth"
                    >
                      <path d="M0,0 L0,6 L9,3 z" fill="#3b82f6" />
                    </marker>
                  </defs>

                  {/* Render nodes */}
                  {nodes.map((node) => (
                    <g key={node.id}>
                      <foreignObject x={node.x} y={node.y} width="120" height="60">
                        <div className="bg-blue-100 border-2 border-blue-600 rounded p-2 text-center">
                          <div className="text-xs font-semibold text-blue-900">
                            {node.label}
                          </div>
                        </div>
                      </foreignObject>
                    </g>
                  ))}
                </svg>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-4">
            {/* Explanations */}
            <div className="bg-white rounded-xl shadow p-4 mb-4">
              <h3 className="font-semibold mb-3">AI Explanations</h3>
              <div className="text-sm text-gray-700 leading-relaxed">
                {typingText || "Generate a step to see explanations..."}
              </div>
            </div>

            {/* Steps List */}
            <div className="bg-white rounded-xl shadow p-4">
              <h3 className="font-semibold mb-3">Steps History</h3>
              {project.steps.length === 0 && (
                <div className="text-sm text-gray-500">No steps yet</div>
              )}
              <ul className="space-y-2">
                {project.steps.map((s) => (
                  <li
                    key={s.step}
                    className="p-2 border rounded text-sm cursor-pointer hover:bg-gray-50"
                  >
                    Step {s.step}: {s.nodes.length} nodes
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed right-6 bottom-6 bg-red-600 text-white px-4 py-2 rounded shadow">
          <div className="flex items-center gap-3">
            <div>Error</div>
            <div className="text-sm opacity-90">{error}</div>
            <button className="ml-2 opacity-80" onClick={() => setError(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentProjectEditorPage() {
  return (
    <ProtectedRoute>
      <NavHeader />
      <StudentProjectEditorInner />
    </ProtectedRoute>
  );
}
```

---

## 🎯 Admin Review APIs (Bonus - Already Built)

### 13. List Submissions
**File:** `src/app/api/admin/submissions/route.ts`

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentSubmission } from "@/lib/backend/models/StudentSubmission";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const q = new URL(req.url).searchParams;
  const page = parseInt(q.get("page") || "1");
  const per = Math.min(parseInt(q.get("per") || "20"), 100);
  const skip = (page - 1) * per;

  const total = await StudentSubmission.countDocuments();
  const subs = await StudentSubmission.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(per)
    .populate("userId", "name email")
    .populate("projectId", "appType")
    .lean();

  return NextResponse.json({ submissions: subs, meta: { total, page, per } });
}
```

### 14. Verify Submission
**File:** `src/app/api/admin/submissions/[id]/verify/route.ts`

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentSubmission } from "@/lib/backend/models/StudentSubmission";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { AdminLog } from "@/lib/backend/models/AdminLog";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = params.id;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await connectDB();
  const submission = await StudentSubmission.findById(id);
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  submission.status = "verified";
  await submission.save();

  // update project status too
  await StudentProject.findByIdAndUpdate(submission.projectId, { status: "verified" });

  // log admin action
  await AdminLog.create({
    adminId: auth.id,
    designId: submission.projectId,
    action: "submission:verify",
    meta: { submissionId: id },
    ip: req.headers.get("x-forwarded-for") || "unknown",
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ ok: true, submissionId: id });
}
```

### 15. Flag Submission
**File:** `src/app/api/admin/submissions/[id]/flag/route.ts`

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentSubmission } from "@/lib/backend/models/StudentSubmission";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { AdminLog } from "@/lib/backend/models/AdminLog";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = params.id;
  const body = await req.json();
  const reason = body?.reason || "flagged by admin";

  await connectDB();
  const submission = await StudentSubmission.findById(id);
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  submission.status = "flagged";
  await submission.save();

  await StudentProject.findByIdAndUpdate(submission.projectId, { status: "flagged" });

  await AdminLog.create({
    adminId: auth.id,
    designId: submission.projectId,
    action: "submission:flag",
    meta: { submissionId: id, reason },
    ip: req.headers.get("x-forwarded-for") || "unknown",
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ ok: true, submissionId: id });
}
```

### 16. Add Admin Review/Feedback
**File:** `src/app/api/admin/submissions/[id]/review/route.ts`

```typescript
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentSubmission } from "@/lib/backend/models/StudentSubmission";
import { AdminLog } from "@/lib/backend/models/AdminLog";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = params.id;
  const body = await req.json();
  const note = body?.note || "";
  const status = body?.status || "reviewed"; // allow reviewed/verified/flagged

  await connectDB();
  const submission = await StudentSubmission.findById(id);
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  submission.adminFeedback = { adminId: auth.id, note, createdAt: new Date() };
  submission.status = status;
  await submission.save();

  await AdminLog.create({
    adminId: auth.id,
    designId: submission.projectId,
    action: "submission:review",
    meta: { submissionId: id, note, status },
    ip: req.headers.get("x-forwarded-for") || "unknown",
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ ok: true, submissionId: id });
}
```

---

## 📊 Summary

### Total Files Created/Modified:
- **Backend Models:** 2 files (StudentProject, StudentSubmission)
- **Mock Generator:** 1 file (mockStudentGenerator.ts)
- **API Routes:** 10 files (6 student APIs + 4 admin APIs)
- **Frontend Pages:** 3 files (landing, new, [id])

### Key Features:
✅ Deterministic architecture generation (not random)  
✅ Skill-level-based templates (beginner/intermediate/advanced)  
✅ SVG canvas with React components (foreignObject technique)  
✅ Step-by-step guided building  
✅ Submit → Admin review workflow  
✅ Typing animation for explanations  
✅ Complete CRUD for student projects  
✅ MongoDB indexes for performance  

---

**Built on:** November 21, 2025  
**Status:** Complete but UI needs styling improvements  
**Next Steps:** Show this to master and discuss UI redesign strategy
