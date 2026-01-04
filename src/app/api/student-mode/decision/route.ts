import { NextRequest, NextResponse } from "next/server";
import { architectureStore } from "@/lib/student-mode/store";
import { applyDecision } from "@/lib/student-mode/apply-decision";
import { DECISIONS } from "@/lib/student-mode/decisions-sim";

export async function POST(req: NextRequest) {
  const { projectId, decisionId } = await req.json();

  if (!projectId || !decisionId) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const base = architectureStore.get(projectId);
  if (!base) {
    return NextResponse.json({ error: "Architecture not found" }, { status: 404 });
  }

  const updated = applyDecision(base, decisionId);
  architectureStore.set(projectId, updated);

  const decision = DECISIONS.find(d => d.id === decisionId);

  return NextResponse.json({
    architecture: updated,
    explanation: decision?.effect.explanation,
    scoreDelta: decision?.effect.scoreDelta
  });
}
