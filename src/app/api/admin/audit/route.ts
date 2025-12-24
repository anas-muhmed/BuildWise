// GET /api/admin/audit?projectId=...
import { NextRequest, NextResponse } from "next/server";
import { getAuditLogs } from "@/lib/backend/audit";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get("projectId");
    
    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: "projectId required" },
        { status: 400 }
      );
    }
    
    const logs = await getAuditLogs(projectId);
    
    return NextResponse.json({
      ok: true,
      audit: logs
    });
  } catch (err) {
    console.error("[audit] error:", err);
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
