import { NextRequest, NextResponse } from "next/server";
import { architectureStore, projectDefinitionStore } from "@/lib/student-mode/store";
import { getDecisions } from "@/lib/student-mode/decisions/store";
import { getProjectContext } from "@/lib/student-mode/context";
import { scoreArchitecture } from "@/lib/student-mode/score-engine";
import { AI_CONFIG } from "@/lib/backend/ai/config";
import { callOpenAI } from "@/lib/backend/ai/openaiProvider";
import { buildArchitectureReviewPrompt } from "@/lib/backend/ai/prompts/architectureReview.prompt";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    console.warn("[student-score] Missing projectId");
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  console.log("[student-score] Fetching score for projectId:", projectId);
  const state = architectureStore.get(projectId);
  console.log("[student-score] Architecture store state:", state);

  if (!state) {
    console.warn("[student-score] Architecture not found in store, using default score");
    // Return default score instead of 404
    const defaultScore = {
      breakdown: {
        simplicity: { score: 25, max: 30, reason: "Basic 3-tier architecture is easy to understand" },
        scalability: { score: 15, max: 25, reason: "Can handle moderate load with current design" },
        maintainability: { score: 20, max: 25, reason: "Standard patterns make maintenance straightforward" },
        cost: { score: 15, max: 20, reason: "Simple setup keeps costs low" },
      },
      total: 75,
      max: 100,
      summary: "Solid foundation for an MVP. Consider adding caching and load balancing as you scale.",
      source: "mock",
    };
    return NextResponse.json(defaultScore);
  }

  const architecture = state.architecture || state.baseArchitecture || state;
  
  if (!architecture || !architecture.nodes) {
    console.warn("[student-score] Invalid architecture data, using default");
    const defaultScore = {
      breakdown: {
        simplicity: { score: 20, max: 30, reason: "Define your architecture first" },
      },
      total: 20,
      max: 100,
      summary: "Start by adding components to your architecture.",
      source: "mock",
    };
    return NextResponse.json(defaultScore);
  }

  const decisions = getDecisions(projectId);
  const context = getProjectContext(projectId);

  // Get mock score first (fallback)
  const mockScore = scoreArchitecture({
    nodes: architecture.nodes,
    edges: architecture.edges,
    decisions,
    context,
  });

  if (AI_CONFIG.USE_REAL_AI) {
    try {
      console.log("[student-score] Using real AI for architecture review");
      
      const projectDef = projectDefinitionStore.get(projectId);
      const projectContext = projectDef 
        ? `Name: ${projectDef.name}\nDescription: ${projectDef.description}\nTeam: ${context.teamSize} developers (${context.experienceLevel})`
        : `Team: ${context.teamSize} developers (${context.experienceLevel})`;
      
      const archDesc = `Components:\n${architecture.nodes.map(n => `- ${n.type}: ${n.label}`).join('\n')}\n\nConnections: ${architecture.edges.length} integrations`;
      const decisionsDesc = Object.entries(decisions).map(([k, v]) => `${k}: ${v}`).join(", ") || "None yet";
      
      const prompt = buildArchitectureReviewPrompt({
        projectContext,
        architecture: archDesc,
        decisions: decisionsDesc,
      });

      const systemPrompt = "You are an expert software architect providing constructive feedback to students learning system design.";
      
      const aiResult = await callOpenAI(systemPrompt, prompt);
      const aiScore = JSON.parse(aiResult.content);
      
      console.log("[student-score] Real AI review generated successfully");
      
      return NextResponse.json({
        ...aiScore,
        source: "ai",
      });
    } catch (error) {
      console.error("[student-score] AI failed, using fallback:", error);
      // Fall through to mock
    }
  }

  console.log("[student-score] Using mock score");
  return NextResponse.json({
    ...mockScore,
    source: "mock",
  });
}
