import { NextRequest, NextResponse } from "next/server";
import { architectureStore } from "@/lib/student-mode/store";
import { ExecutionBlueprint } from "@/lib/student-mode/execution-types";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  const state = architectureStore.get(projectId);

  if (!state || !state.architecture) {
    return NextResponse.json(
      { error: "Architecture not found" },
      { status: 404 }
    );
  }

  const architecture = state.architecture;

  const components = architecture.nodes.map((node: { label: string; type: string }) => ({
    name: node.label,
    type: node.type,
    responsibilities: responsibilityMap[node.type] ?? ["General responsibility"],
  }));

  const blueprint: ExecutionBlueprint = {
    projectId,

    systemOverview: [
      "Client interacts with frontend",
      "Backend handles business logic",
      "Database stores persistent data",
    ],

    components,

    developmentPhases: [
      {
        phase: "Phase 1 – Foundation",
        tasks: [
          "Initialize backend project",
          "Design database schema",
          "Create basic API contracts",
        ],
      },
      {
        phase: "Phase 2 – Core Features",
        tasks: [
          "Build frontend screens",
          "Connect frontend to backend APIs",
          "Handle authentication and validation",
        ],
      },
      {
        phase: "Phase 3 – Optimization",
        tasks: [
          "Introduce cache if required",
          "Add async processing (queue)",
          "Improve error handling and logging",
        ],
      },
    ],

    risks: [
      "Too many services increase complexity",
      "Async processing adds debugging difficulty",
      "Cache invalidation must be handled carefully",
    ],

    nextSteps: [
      "Set up repository structure",
      "Assign components to developers",
      "Start implementation phase",
    ],
  };

  return NextResponse.json(blueprint);
}

const responsibilityMap: Record<string, string[]> = {
  frontend: ["UI rendering", "User interaction", "API communication"],
  backend: ["Business logic", "Validation", "Security"],
  database: ["Data persistence", "Consistency", "Backup"],
  cache: ["Performance optimization", "Reduce DB load"],
  queue: ["Async processing", "Event handling"],
};
