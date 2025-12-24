// POST /api/student/project/[id]/merge
import { NextRequest, NextResponse } from "next/server";
import { getLatestSnapshot, saveSnapshot } from "@/lib/backend/snapshots";
import { detectConflicts } from "@/lib/backend/conflicts";
import { appendAudit } from "@/lib/backend/audit";
import { getAuthUserFromRequest } from "@/lib/backend/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await context.params;
    const payload = await req.json();
    
    // Get latest snapshot
    const latest = await getLatestSnapshot(projectId);
    if (!latest) {
      return NextResponse.json(
        { ok: false, error: "no snapshot" },
        { status: 404 }
      );
    }
    
    // Detect conflicts before merging
    const conflictResult = detectConflicts(
      latest.nodes || [],
      payload.nodes || [],
      latest.edges || [],
      payload.edges || []
    );
    
    if (conflictResult.hasConflicts) {
      // Log conflict detection
      const authUser = getAuthUserFromRequest(req);
      const actor = authUser?.userId || "unknown";
      await appendAudit(projectId, {
        actor,
        action: "merge_conflict_detected",
        details: {
          conflicts: conflictResult.conflicts
        }
      });
      
      return NextResponse.json({
        ok: false,
        conflicts: conflictResult.conflicts,
        error: "Merge conflicts detected. Admin review required."
      });
    }
    
    // No conflicts - perform merge (simple: combine arrays)
    const mergedNodes = [...(latest.nodes || []), ...(payload.nodes || [])];
    const mergedEdges = [...(latest.edges || []), ...(payload.edges || [])];
    
    // Deduplicate by ID
    const uniqueNodes = Array.from(
      new Map(mergedNodes.map(n => [n.id, n])).values()
    );
    const uniqueEdges = Array.from(
      new Map(mergedEdges.map(e => [e.id, e])).values()
    );
    
    const newVersion = Date.now();
    const merged = await saveSnapshot(projectId, {
      version: newVersion,
      nodes: uniqueNodes,
      edges: uniqueEdges,
      modules: latest.modules,
      rationale: latest.rationale || "",
      ai_feedback: latest.ai_feedback || {}
    });
    
    // Log successful merge
    const authUser = getAuthUserFromRequest(req);
    const actor = authUser?.userId || "unknown";
    await appendAudit(projectId, {
      actor,
      action: "merge_completed",
      details: {
        nodeCount: uniqueNodes.length,
        edgeCount: uniqueEdges.length
      }
    });
    
    return NextResponse.json({
      ok: true,
      snapshot: merged
    });
  } catch (err) {
    console.error("[merge] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
