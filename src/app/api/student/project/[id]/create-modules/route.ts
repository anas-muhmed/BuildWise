// src/app/api/student/project/[id]/create-modules/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { requireRoleOrThrow } from "@/lib/backend/auth";
import { ModuleModel } from "@/lib/backend/models/Module";
import { AuditModel } from "@/lib/backend/models/Audit";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);
    await connectDB();
    
    const { id: projectId } = await params;
    const project = await StudentProject.findById(projectId);
    if (!project) return NextResponse.json({ ok: false, error: "project not found" }, { status: 404 });

    if (String(project.userId) !== String(user.userId) && !["teacher", "admin"].includes(user.role)) {
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
    }

    const steps = project.steps || [];
    if (!Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ ok: false, error: "no steps to convert" }, { status: 400 });
    }

    // create modules from steps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const created: any[] = [];
    for (const s of steps) {
      const moduleDoc = await ModuleModel.create({
        projectId,
        name: s.step ? `Step ${s.step}` : (s.name || `Module ${Date.now()}`),
        description: s.explanations || "",
        order: s.step || 0,
        status: "proposed",
        nodes: s.nodes || [],
        edges: s.edges || [],
        rationale: s.explanations || "",
        ai_feedback: {
          confidence: "medium",
          raw_llm_output: null
        }
      });
      created.push(moduleDoc);
    }

    // Audit
    try {
      await AuditModel.create({
        projectId,
        conflictId: null,
        action: "student_create_modules",
        actor: user.userId,
        details: { modulesCount: created.length, timestamp: new Date().toISOString() }
      });
    } catch (ae) {
      console.warn("failed to write audit for create-modules", ae);
    }

    return NextResponse.json({ ok: true, modules: created });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("create-modules error", error);
    return NextResponse.json({ ok: false, error: error?.message || "internal" }, { status: 500 });
  }
}
