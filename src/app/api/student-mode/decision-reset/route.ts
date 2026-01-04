import { NextRequest, NextResponse } from "next/server";
import { architectureStore } from "@/lib/student-mode/store";

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

    // Reset to base architecture
    architectureStore.set(projectId, {
      ...state,
      baseArchitecture,
      activeDecisions: [],
      architecture: baseArchitecture,
    });

    return NextResponse.json({
      architecture: baseArchitecture,
      activeDecisions: [],
      message: "Reset to base architecture",
    });
  } catch (err) {
    console.error("Reset error:", err);
    return NextResponse.json({ 
      error: "Failed to reset",
      activeDecisions: [],
    }, { status: 500 });
  }
}
