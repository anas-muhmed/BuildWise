import { NextRequest, NextResponse } from "next/server";
import { buildArchitecture } from "@/lib/student-mode/architecture-rules";
import { reasoningStore, architectureStore } from "@/lib/student-mode/store";

export async function POST(req: NextRequest) {
  try {
    const { projectId } = await req.json();

    if (!projectId) {
      return NextResponse.json({ error: "projectId required" }, { status: 400 });
    }

    const reasoning = reasoningStore.get(projectId);

    if (!reasoning) {
      return NextResponse.json(
        { error: "Reasoning not completed" },
        { status: 404 }
      );
    }

    const architecture = buildArchitecture(
      projectId,
      reasoning.answers
    );

    // Store as BASE architecture with empty decisions
    architectureStore.set(projectId, {
      baseArchitecture: architecture,
      activeDecisions: [],
      architecture: architecture, // initially same as base
    });

    return NextResponse.json(architecture);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Materialization failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const state = architectureStore.get(projectId);

  if (!state) {
    return NextResponse.json(
      { error: "Architecture not found" },
      { status: 404 }
    );
  }

  // Return computed architecture
  return NextResponse.json(state.architecture || state.baseArchitecture || state);
}
