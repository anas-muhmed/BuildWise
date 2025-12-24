// POST /api/student/project/[id]/save-architecture
import { NextRequest, NextResponse } from "next/server";
import { saveSnapshot } from "@/lib/backend/snapshots";
import { appendAudit } from "@/lib/backend/audit";
import { getAuthUserFromRequest } from "@/lib/backend/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication (optional - allow students to save)
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      console.warn("[save-architecture] No auth user, proceeding as guest");
    }

    const { id: projectId } = await context.params;
    const payload = await req.json();
    
    const version = Date.now();
    const snapshot = {
      version,
      nodes: payload.nodes || [],
      edges: payload.edges || [],
      modules: payload.modules || [],
      rationale: payload.rationale || "",
      ai_feedback: payload.ai_feedback || {}
    };
    
    const saved = await saveSnapshot(projectId, snapshot);
    
    // Log audit entry
    const actor = authUser?.userId || "guest";
    await appendAudit(projectId, {
      actor,
      action: "save_architecture",
      details: {
        version,
        nodeCount: payload.nodes?.length || 0,
        edgeCount: payload.edges?.length || 0
      }
    });
    
    return NextResponse.json({
      ok: true,
      snapshotId: saved._id,
      snapshot: saved
    });
  } catch (err) {
    console.error("[save-architecture] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
