import { NextRequest, NextResponse } from "next/server";
import { architectureStore, savedDesignsStore } from "@/lib/student-mode/store";
import { recomputeArchitecture } from "@/lib/student-mode/recompute-architecture";
import { scoreArchitecture } from "@/lib/student-mode/score-engine";
import { getProjectContext } from "@/lib/student-mode/context";
import { getDecisions } from "@/lib/student-mode/decisions/store";
import crypto from "crypto";

// POST /api/student-mode/version/save - Save current state
export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const state = architectureStore.get(projectId);
    if (!state || !state.baseArchitecture) {
      return NextResponse.json({ error: "No architecture to save" }, { status: 404 });
    }

    const decisions = getDecisions(projectId);
    const context = getProjectContext(projectId);

    // Calculate score
    const architecture = recomputeArchitecture(
      state.baseArchitecture,
      state.activeDecisions || []
    );

    const scoreData = scoreArchitecture({
      nodes: architecture.nodes,
      edges: architecture.edges,
      decisions,
      context,
    });

    const savedDesign = {
      id: crypto.randomUUID(),
      projectId,
      timestamp: Date.now(),
      base: state.baseArchitecture,
      decisions: state.activeDecisions || [],
      score: scoreData.total,
    };

    savedDesignsStore.add(projectId, savedDesign);

    return NextResponse.json(savedDesign);
  } catch (err) {
    console.error("Save error:", err);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
