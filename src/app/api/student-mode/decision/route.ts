import { NextRequest, NextResponse } from "next/server";
import { architectureStore } from "@/lib/student-mode/store";
import { applyDecision } from "@/lib/student-mode/apply-decision";
import { DECISIONS } from "@/lib/student-mode/decisions-sim";
import { getAuthUserFromRequest } from "@/lib/backend/auth";
import { validateDecisionPayload } from "@/lib/validation/schemas";

export async function POST(req: NextRequest) {
  // 🔒 Require authentication
  const user = getAuthUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  
  // Validate input
  const validation = validateDecisionPayload(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { projectId, decisionId } = validation.data!;

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
