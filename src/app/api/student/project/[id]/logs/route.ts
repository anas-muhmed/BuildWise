// Debug endpoint to view job logs (dev only)
import { NextResponse } from "next/server";
import { getProject } from "@/lib/backend/projects";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Only available in development" }, { status: 403 });
  }

  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get audit logs (which include job-related events)
    const auditLogs = project.audit || [];
    const recentLogs = auditLogs.slice(-20); // Last 20 entries

    return NextResponse.json({ 
      ok: true, 
      logs: recentLogs,
      snapshotCount: project.snapshots?.length || 0,
      latestSnapshot: project.snapshots?.[project.snapshots.length - 1] || null
    });
  } catch (error) {
    console.error("[debug/logs] Error:", error);
    return NextResponse.json({ 
      ok: false, 
      error: error instanceof Error ? error.message : "Failed to fetch logs" 
    }, { status: 500 });
  }
}
