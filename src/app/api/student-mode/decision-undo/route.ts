import { NextRequest, NextResponse } from "next/server";
import { architectureStore } from "@/lib/student-mode/store";
import { recomputeArchitecture } from "@/lib/student-mode/recompute-architecture";

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const state = architectureStore.get(projectId);
    if (!state) {
      return NextResponse.json({ error: "State not found" }, { status: 404 });
    }

    // Migrate old format if needed
    let baseArchitecture = state.baseArchitecture;
    if (!baseArchitecture && state.nodes) {
      baseArchitecture = { nodes: state.nodes, edges: state.edges };
    }

    if (!baseArchitecture) {
      return NextResponse.json({ error: "Invalid state format" }, { status: 500 });
    }

    let activeDecisions = state.activeDecisions ?? [];

    if (activeDecisions.length === 0) {
      return NextResponse.json({ 
        message: "No decisions to undo",
        architecture: baseArchitecture,
        activeDecisions: [],
      });
    }

    // Remove last decision
    activeDecisions = activeDecisions.slice(0, -1);

    // Recompute architecture
    const updatedArchitecture = recomputeArchitecture(
      baseArchitecture,
      activeDecisions
    );

    // Save updated state
    architectureStore.set(projectId, {
      ...state,
      baseArchitecture,
      activeDecisions,
      architecture: updatedArchitecture,
    });

    return NextResponse.json({
      architecture: updatedArchitecture,
      activeDecisions,
      message: "Last decision removed",
    });
  } catch (err) {
    console.error("Undo error:", err);
    return NextResponse.json({ 
      error: "Failed to undo",
      activeDecisions: [],
    }, { status: 500 });
  }
}
