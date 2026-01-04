import { NextRequest, NextResponse } from "next/server";
import { savedDesignsStore } from "@/lib/student-mode/store";
import { compareVersions } from "@/lib/student-mode/compare-versions";

export async function POST(req: NextRequest) {
  try {
    const { projectId, versionAId, versionBId } = await req.json();

    if (!projectId || !versionAId || !versionBId) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const versionA = savedDesignsStore.getById(projectId, versionAId);
    const versionB = savedDesignsStore.getById(projectId, versionBId);

    if (!versionA || !versionB) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    const comparison = compareVersions(versionA, versionB);

    return NextResponse.json(comparison);
  } catch (err) {
    console.error("Compare error:", err);
    return NextResponse.json({ error: "Failed to compare versions" }, { status: 500 });
  }
}
