import { NextRequest, NextResponse } from "next/server";
import { architectureStore } from "@/lib/student-mode/store";
import { recomputeArchitecture } from "@/lib/student-mode/recompute-architecture";
import { DECISIONS } from "@/lib/student-mode/decisions-sim";

export async function POST(req: NextRequest) {
  try {
    const { projectId, decisionId } = await req.json();

    if (!projectId || !decisionId) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const state = architectureStore.get(projectId);
    if (!state) {
      return NextResponse.json({ error: "State not found" }, { status: 404 });
    }

    // Migrate old format to new format if needed
    let baseArchitecture = state.baseArchitecture;
    let activeDecisions = state.activeDecisions ?? [];

    if (!baseArchitecture && state.nodes) {
      // Old format detected - migrate
      baseArchitecture = { nodes: state.nodes, edges: state.edges };
      architectureStore.set(projectId, {
        baseArchitecture,
        activeDecisions: [],
        architecture: baseArchitecture,
      });
    }

    if (!baseArchitecture) {
      return NextResponse.json({ error: "Invalid state format" }, { status: 500 });
    }

    // Toggle decision
    if (activeDecisions.includes(decisionId)) {
      // Remove decision
      activeDecisions = activeDecisions.filter((d: string) => d !== decisionId);
    } else {
      // Add decision
      activeDecisions = [...activeDecisions, decisionId];
    }

    // Recompute architecture from base + active decisions
    const updatedArchitecture = recomputeArchitecture(
      baseArchitecture,
      activeDecisions
    );

    // Save updated state
    architectureStore.set(projectId, {
      ...state,
      activeDecisions,
      architecture: updatedArchitecture,
    });

    const decision = DECISIONS.find(d => d.id === decisionId);

    return NextResponse.json({
      architecture: updatedArchitecture,
      activeDecisions,
      explanation: decision?.effect.explanation || "Decision applied",
      scoreDelta: decision?.effect.scoreDelta || 0,
    });
  } catch (err) {
    console.error("Decision-toggle POST error:", err);
    return NextResponse.json({ 
      error: "Failed to toggle decision",
      activeDecisions: [],
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const projectId = req.nextUrl.searchParams.get("projectId");

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const state = architectureStore.get(projectId);
    if (!state) {
      return NextResponse.json({ 
        activeDecisions: [],
      });
    }

    return NextResponse.json({
      activeDecisions: state.activeDecisions ?? [],
    });
  } catch (err) {
    console.error("Decision-toggle GET error:", err);
    return NextResponse.json({ 
      activeDecisions: [],
      error: "Failed to fetch decisions"
    }, { status: 500 });
  }
}
