// src/app/api/generative/projects/[projectId]/modules/[moduleId]/propose/[editId]/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { ModuleModel, ModuleNode, ModuleEdge } from "@/lib/backend/models/Module";
import { requireRoleOrThrow } from "@/lib/backend/auth";
import { AuditModel } from "@/lib/backend/models/Audit";

type RouteContext = {
  params: Promise<{ projectId: string; moduleId: string; editId: string }>;
};

/**
 * Accept or reject a proposed edit
 * Body: { action: "accept" | "reject" }
 * Only teacher/admin allowed
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    await connectDB();
    const user = requireRoleOrThrow(req, ["teacher", "admin"]);
    const { action } = await req.json();
    const { projectId, moduleId, editId } = await context.params;
    
    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "invalid action" }, 
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

    const edit = (moduleDoc.proposedEdits || []).find((e) => e.id === editId);
    if (!edit) {
      return NextResponse.json(
        { ok: false, error: "edit not found" }, 
        { status: 404 }
      );
    }

    if (action === "accept") {
      // Merge diff into canonical nodes/edges
      // Diff structure: { nodes: [ ...replace-or-add... ], edges: [ ... ] }
      const diff = edit.diff || {};
      
      if (Array.isArray(diff.nodes)) {
        const byId = new Map(moduleDoc.nodes.map((n: ModuleNode) => [n.id, n]));
        for (const n of diff.nodes) {
          byId.set(n.id, n);
        }
        moduleDoc.nodes = Array.from(byId.values());
      }
      
      if (Array.isArray(diff.edges)) {
        const key = (e: ModuleEdge) => 
          `${e.from}->${e.to}${e.label ? '::' + e.label : ''}`;
        const byKey = new Map(moduleDoc.edges.map((e: ModuleEdge) => [key(e), e]));
        for (const e of diff.edges) {
          byKey.set(key(e), e);
        }
        moduleDoc.edges = Array.from(byKey.values());
      }

      edit.status = "accepted";
      moduleDoc.status = "modified"; // or keep approved depending on policy
      moduleDoc.approvedBy = user.userId;
      moduleDoc.approvedAt = new Date();
    } else {
      edit.status = "rejected";
    }

    await moduleDoc.save();
    
    // Create audit record
    await AuditModel.create({ 
      projectId: projectId, 
      action: action === "accept" ? "accept_proposed_edit" : "reject_proposed_edit", 
      actor: user.userId, 
      details: { moduleId: moduleId, editId: editId } 
    });

    return NextResponse.json({ ok: true, module: moduleDoc, edit });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    console.error("proposed edit accept/reject error", err);
    return NextResponse.json(
      { ok: false, error: error?.message || "internal" }, 
      { status: error?.status || 500 }
    );
  }
}
