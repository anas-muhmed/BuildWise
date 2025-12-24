// PATCH /api/student/project/[id]/modules/[moduleId]/approve
import { NextRequest, NextResponse } from "next/server";
import { getLatestSnapshot, saveSnapshot } from "@/lib/backend/snapshots";
import { updateProject } from "@/lib/backend/projects";
import { appendAudit } from "@/lib/backend/audit";
import { requireRole, unauthorizedResponse, forbiddenResponse } from "@/lib/backend/rbac";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; moduleId: string }> }
) {
  try {
    // RBAC: Only teacher and admin can approve modules
    let authUser;
    try {
      authUser = requireRole(req, ["teacher", "admin"]);
    } catch (err) {
      const error = err as Error;
      if (error.message.includes("Unauthorized")) {
        return unauthorizedResponse(error.message);
      }
      return forbiddenResponse(error.message);
    }

    const { id: projectId, moduleId } = await context.params;
    
    // Get latest snapshot
    const latest = await getLatestSnapshot(projectId);
    if (!latest) {
      return NextResponse.json(
        { ok: false, error: "no snapshot" },
        { status: 404 }
      );
    }
    
    // Create new immutable snapshot with incremented version
    // Mark module as approved in metadata
    const newSnap = {
      ...latest,
      version: latest.version + 1,
      modules: latest.modules || [],
      metadata: {
        ...(latest.metadata || {}),
        approvedModules: [
          ...((latest.metadata as { approvedModules?: string[] })?.approvedModules || []),
          moduleId
        ]
      }
    };
    
    const saved = await saveSnapshot(projectId, newSnap);
    
    // Update project status
    await updateProject(projectId, { status: "in_progress" });
    
    // Log audit entry
    await appendAudit(projectId, {
      actor: authUser.userId,
      action: "approve_module",
      details: { moduleId, role: authUser.role }
    });
    
    return NextResponse.json({
      ok: true,
      snapshot: saved
    });
  } catch (err) {
    console.error("[approve-module] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
