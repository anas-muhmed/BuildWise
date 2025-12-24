// Debug endpoint to force-run snapshot job (dev only)
import { NextResponse } from "next/server";
import { enqueueSnapshotJob } from "@/lib/backend/jobs";

export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 });
  }

  try {
    console.log(`[debug/run-job] Force-running snapshot job for project ${id}`);
    await enqueueSnapshotJob(id, {});

    return NextResponse.json({ 
      ok: true, 
      message: "Job enqueued. Check server logs for [job] messages.",
      jobId: id 
    });
  } catch (error) {
    console.error("[debug/run-job] Error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Failed to enqueue job" 
    }, { status: 500 });
  }
}
