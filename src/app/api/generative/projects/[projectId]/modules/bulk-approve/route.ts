// src/app/api/generative/projects/[projectId]/modules/bulk-approve/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { ModuleModel } from "@/lib/backend/models/Module";
import { requireRoleOrThrow } from "@/lib/backend/auth";
import { AuditModel } from "@/lib/backend/models/Audit";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

/**
 * Bulk approve or reject modules
 * Body: { moduleIds: string[], action: "approve"|"reject", note?: string }
 * Only teacher/admin allowed
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    await connectDB();
    const user = requireRoleOrThrow(req, ["teacher", "admin"]);
    const { moduleIds, action, note } = await req.json();
    const { projectId } = await context.params;
    
    if (!Array.isArray(moduleIds) || !moduleIds.length) {
      return NextResponse.json(
        { ok: false, error: "moduleIds required" }, 
        { status: 400 }
      );
    }
    
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json(
        { ok: false, error: "invalid action" }, 
        { status: 400 }
      );
    }

    const ops = [];
    for (const id of moduleIds) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const update: any = {};
      update.status = action === "approve" ? "approved" : "rejected";
      update.approvedBy = user.userId;
      update.approvedAt = new Date();
      if (note) {
        update["meta.adminNote"] = note;
      }
      ops.push(
        ModuleModel.findByIdAndUpdate(id, { $set: update }, { new: true })
      );
    }
    
    const updated = await Promise.all(ops);

    // Create audit record
    try {
      await AuditModel.create({
        projectId: projectId,
        action: `bulk_${action}_modules`,
        actor: user.userId,
        details: { 
          moduleIds, 
          note, 
          updatedCount: updated.filter(u => u !== null).length, 
          timestamp: new Date().toISOString() 
        }
      });
    } catch (ae) {
      console.warn("audit write failed for bulk approve", ae);
    }

    return NextResponse.json({ 
      ok: true, 
      updated: updated.filter(u => u !== null) 
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    console.error("bulk-approve error", err);
    return NextResponse.json(
      { ok: false, error: error?.message || "internal" }, 
      { status: error?.status || 500 }
    );
  }
}
