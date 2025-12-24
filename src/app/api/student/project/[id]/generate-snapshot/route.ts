// POST /api/student/project/[id]/generate-snapshot
import { NextRequest, NextResponse } from "next/server";
import { enqueueSnapshotJob } from "@/lib/backend/jobs";
import { getAuthUserFromRequest } from "@/lib/backend/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication (optional - allow students to generate)
    const authUser = getAuthUserFromRequest(req);
    if (!authUser) {
      console.warn("[generate-snapshot] No auth user, proceeding as guest");
    }

    const { id: projectId } = await context.params;
    
    // Trigger async snapshot generation
    await enqueueSnapshotJob(projectId);
    
    return NextResponse.json({
      ok: true,
      message: "Snapshot generation started"
    });
  } catch (err) {
    console.error("[generate-snapshot] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
