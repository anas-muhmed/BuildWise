import { NextRequest, NextResponse } from "next/server";
import { architectureStore, savedDesignsStore } from "@/lib/student-mode/store";
import { recomputeArchitecture } from "@/lib/student-mode/recompute-architecture";

// POST /api/student-mode/version/load - Load a saved version
export async function POST(req: NextRequest) {
  try {
    const { projectId, designId } = await req.json();

    if (!projectId || !designId) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const savedDesign = savedDesignsStore.getById(projectId, designId);

    if (!savedDesign) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Restore the saved state
    const architecture = recomputeArchitecture(
      savedDesign.base,
      savedDesign.decisions
    );

    architectureStore.set(projectId, {
      baseArchitecture: savedDesign.base,
      activeDecisions: savedDesign.decisions,
      architecture,
    });

    return NextResponse.json({
      architecture,
      activeDecisions: savedDesign.decisions,
      message: "Version loaded successfully",
    });
  } catch (err) {
    console.error("Load version error:", err);
    return NextResponse.json({ error: "Failed to load version" }, { status: 500 });
  }
}
