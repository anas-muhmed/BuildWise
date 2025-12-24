// POST /api/snapshots/[projectId]/rollback
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { Snapshot } from "@/lib/backend/snapshots";
import { requireRole, unauthorizedResponse, forbiddenResponse } from "@/lib/backend/rbac";
import { appendAudit } from "@/lib/backend/audit";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ projectId: string }> }
) {
  try {
    // RBAC: Only teacher and admin can rollback
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

    const { projectId } = await context.params;
    const body = await req.json();
    const targetVersion = body.version;
    
    if (!targetVersion) {
      return NextResponse.json(
        { ok: false, error: "version required" },
        { status: 400 }
      );
    }
    
    await connectDB();
    
    // Find target snapshot
    const target = await Snapshot.findOne({
      projectId,
      version: targetVersion
    }).lean();
    
    if (!target) {
      return NextResponse.json(
        { ok: false, error: "version not found" },
        { status: 404 }
      );
    }
    
    // Create new snapshot identical to target but with new version number
    const newVersion = Date.now();
    const saved = await Snapshot.create({
      projectId,
      version: newVersion,
      nodes: target.nodes,
      edges: target.edges,
      modules: target.modules,
      rationale: target.rationale,
      ai_feedback: target.ai_feedback,
      metadata: {
        ...(target.metadata || {}),
        rolledBackFrom: targetVersion
      }
    });
    
    // Log audit entry
    await appendAudit(projectId, {
      actor: authUser.userId,
      action: "rollback_snapshot",
      details: { targetVersion, newVersion, role: authUser.role }
    });
    
    return NextResponse.json({
      ok: true,
      snapshot: saved
    });
  } catch (err) {
    console.error("[rollback] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
