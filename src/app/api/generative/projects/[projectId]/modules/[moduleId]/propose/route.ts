// src/app/api/generative/projects/[projectId]/modules/[moduleId]/propose/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { ModuleModel } from "@/lib/backend/models/Module";
import { requireAuthOrThrow } from "@/lib/backend/auth";
import { AuditModel } from "@/lib/backend/models/Audit";
import { nanoid } from "nanoid";

type RouteContext = {
  params: Promise<{ projectId: string; moduleId: string }>;
};

/**
 * Propose an edit to a module
 * Body: { diff: { nodes?: [...], edges?: [...] } }
 * Any authenticated user can propose edits
 */
export async function PATCH(req: Request, context: RouteContext) {
  try {
    await connectDB();
    const user = requireAuthOrThrow(req);
    const body = await req.json();
    const { diff } = body;
    const { projectId, moduleId } = await context.params;
    
    // Diff should be JSON patch or minimal structure e.g. { nodes: [...], edges: [...] }
    if (!diff) {
      return NextResponse.json(
        { ok: false, error: "diff required" }, 
        { status: 400 }
      );
    }

    const moduleDoc = await ModuleModel.findById(moduleId);
    if (!moduleDoc) {
      return NextResponse.json(
        { ok: false, error: "module not found" }, 
        { status: 404 }
      );
    }

    const editId = nanoid();
    const proposed = {
      id: editId,
      author: user.userId,
      diff,
      createdAt: new Date(),
      status: "open" as const
    };
    
    moduleDoc.proposedEdits = moduleDoc.proposedEdits || [];
    moduleDoc.proposedEdits.push(proposed);
    await moduleDoc.save();

    // Create audit record
    await AuditModel.create({ 
      projectId: projectId, 
      action: "propose_module_edit", 
      actor: user.userId, 
      details: { moduleId: moduleId, editId, diff } 
    });

    return NextResponse.json({ ok: true, proposed });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    console.error("propose edit error", err);
    return NextResponse.json(
      { ok: false, error: error?.message || "internal" }, 
      { status: error?.status || 500 }
    );
  }
}
