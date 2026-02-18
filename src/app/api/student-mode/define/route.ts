import { NextRequest, NextResponse } from "next/server";
import { projectDefinitionStore } from "@/lib/student-mode/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, name, goal, audience } = body;

    if (!projectId || !name || !goal || !audience) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    projectDefinitionStore.set(projectId, {
      projectId,
      name,
      goal,
      audience,
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to save project definition" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json(
      { error: "projectId missing" },
      { status: 400 }
    );
  }

  const data = projectDefinitionStore.get(projectId);

  if (!data) {
    return NextResponse.json(
      { error: "Definition not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}
