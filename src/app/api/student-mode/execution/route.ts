import { NextRequest, NextResponse } from "next/server";
import { architectureStore, projectDefinitionStore } from "@/lib/student-mode/store";
import { ExecutionBlueprint } from "@/lib/student-mode/execution-types";
import { AI_CONFIG } from "@/lib/backend/ai/config";
import { callOpenAI } from "@/lib/backend/ai/openaiProvider";
import { buildExecutionPlanPrompt } from "@/lib/backend/ai/prompts/executionPlan.prompt";

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

  if (AI_CONFIG.USE_REAL_AI) {
    try {
      console.log("[student-execution] Using real AI for execution plan");
      
      const projectDef = projectDefinitionStore.get(projectId);
      const projectContext = projectDef 
        ? `Project: ${projectDef.name}\nGoal: ${projectDef.goal}\nAudience: ${projectDef.audience}`
        : "Student architecture project";
      
      const archDesc = `Components:\n${architecture.nodes.map(n => `- ${n.type}: ${n.label}`).join('\n')}\n\nTotal components: ${architecture.nodes.length}`;
      
      const prompt = buildExecutionPlanPrompt({
        projectContext,
        architecture: archDesc,
      });

      const systemPrompt = "You are an experienced technical lead creating implementation plans for development teams.";
      
      const aiResult = await callOpenAI(systemPrompt, prompt);
      const aiPlan = JSON.parse(aiResult.content);
      
      console.log("[student-execution] Real AI execution plan generated");
      
      const blueprint: ExecutionBlueprint = {
        projectId,
        ...aiPlan,
      };
      
      return NextResponse.json({
        ...blueprint,
        source: "ai",
      });
    } catch (error) {
      console.error("[student-execution] AI failed, using fallback:", error);
      // Fall through to mock
    }
  }

  console.log("[student-execution] Using mock execution plan");

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

  return NextResponse.json({
    ...blueprint,
    source: "mock",
  });
}

const responsibilityMap: Record<string, string[]> = {
  frontend: ["UI rendering", "User interaction", "API communication"],
  backend: ["Business logic", "Validation", "Security"],
  database: ["Data persistence", "Consistency", "Backup"],
  cache: ["Performance optimization", "Reduce DB load"],
  queue: ["Async processing", "Event handling"],
};
