import { NextRequest, NextResponse } from "next/server";
import { architectureStore } from "@/lib/student-mode/store";
import { getDecisions } from "@/lib/student-mode/decisions/store";
import { getProjectContext } from "@/lib/student-mode/context";
import { scoreArchitecture } from "@/lib/student-mode/score-engine";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const architecture = architectureStore.get(projectId);

  if (!architecture) {
    return NextResponse.json(
      { error: "Architecture not found" },
      { status: 404 }
    );
  }

  const decisions = getDecisions(projectId);
  const context = getProjectContext(projectId);

  const score = scoreArchitecture({
    nodes: architecture.nodes,
    edges: architecture.edges,
    decisions,
    context,
  });

  return NextResponse.json(score);
}
