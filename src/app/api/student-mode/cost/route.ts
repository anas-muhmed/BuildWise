import { NextRequest, NextResponse } from "next/server";
import { architectureStore, projectDefinitionStore } from "@/lib/student-mode/store";
import { getProjectContext } from "@/lib/student-mode/context";
import { estimateCost } from "@/lib/student-mode/cost-estimator";
import { AI_CONFIG } from "@/lib/backend/ai/config";
import { callOpenAI } from "@/lib/backend/ai/openaiProvider";
import { buildCostEstimationPrompt } from "@/lib/backend/ai/prompts/costEstimation.prompt";

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
  const context = getProjectContext(projectId);

  if (AI_CONFIG.USE_REAL_AI) {
    try {
      console.log("[student-cost] Using real AI for cost estimation");
      
      const projectDef = projectDefinitionStore.get(projectId);
      const projectContext = projectDef 
        ? `Project: ${projectDef.name}\nGoal: ${projectDef.goal}`
        : "Student architecture project";
      
      const archDesc = `Components:\n${architecture.nodes.map(n => `- ${n.type}: ${n.label}`).join('\n')}`;
      
      const prompt = buildCostEstimationPrompt({
        projectContext,
        architecture: archDesc,
        teamSize: context.teamSize,
      });

      const systemPrompt = "You are a cloud infrastructure cost expert providing realistic pricing estimates for development projects.";
      
      const aiResult = await callOpenAI(systemPrompt, prompt);
      const aiCost = JSON.parse(aiResult.content);
      
      console.log("[student-cost] Real AI cost estimate generated");
      
      return NextResponse.json({
        ...aiCost,
        source: "ai",
      });
    } catch (error) {
      console.error("[student-cost] AI failed, using fallback:", error);
      // Fall through to mock
    }
  }

  console.log("[student-cost] Using mock cost estimate");
  
  const mockEstimate = estimateCost(
    { nodes: architecture.nodes, edges: architecture.edges },
    context.teamSize,
    false
  );

  return NextResponse.json({
    ...mockEstimate,
    source: "mock",
  });
}
