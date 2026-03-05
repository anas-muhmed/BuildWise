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
