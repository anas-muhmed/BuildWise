import { NextRequest, NextResponse } from "next/server";
import { setDecision, getDecisions } from "@/lib/student-mode/decisions/store";
import { checkBackendConstraints } from "@/lib/student-mode/constraints/backend";
import { getProjectContext } from "@/lib/student-mode/context";

export async function POST(req: NextRequest) {
  const { projectId, key, value } = await req.json();

  if (!projectId || !key) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Enforce constraints
  if (key === "backendType") {
    const context = getProjectContext(projectId);
    const result = checkBackendConstraints(value, context);

    if (!result.allowed) {
      return NextResponse.json(
        {
          error: result.violation?.reason,
          affectedNodeType: result.violation?.affectedNodeType,
          fixes: result.violation?.fixes,
        },
        { status: 400 }
      );
    }
  }

  setDecision(projectId, key, value);

  return NextResponse.json(getDecisions(projectId));
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  return NextResponse.json(getDecisions(projectId));
}
