import { NextRequest, NextResponse } from "next/server";
import { savedDesignsStore } from "@/lib/student-mode/store";

// GET /api/student-mode/version/list - Get all saved versions
export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const designs = savedDesignsStore.get(projectId);

    // Return sorted by timestamp (newest first)
    const sorted = designs.sort((a: any, b: any) => b.timestamp - a.timestamp);

    return NextResponse.json(sorted);
  } catch (err) {
    console.error("List versions error:", err);
    return NextResponse.json({ error: "Failed to list versions" }, { status: 500 });
  }
}
