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
    console.warn("[student-cost] Missing projectId");
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  console.log("[student-cost] Fetching cost for projectId:", projectId);
  const state = architectureStore.get(projectId);
  console.log("[student-cost] Architecture store state:", state);

  if (!state) {
    console.warn("[student-cost] Architecture not found in store, using default estimates");
    // Return default estimate instead of 404
    const defaultEstimate = {
      infraLevel: "Small",
      monthlyCostUSD: 50,
      engineeringEffort: "1-2 developers, 2-4 weeks",
      operationalRisk: "Low - simple architecture with standard components",
      explanation: [
        "Basic 3-tier architecture (Frontend + API + Database)",
        "Suitable for MVP or small-scale deployment",
        "Can be hosted on Vercel/Railway/Heroku free tiers initially",
        "Database can use managed services like Supabase or PlanetScale",
      ],
      source: "mock",
    };
    return NextResponse.json(defaultEstimate);
  }

  const architecture = state.architecture || state.baseArchitecture || state;
  
  if (!architecture || !architecture.nodes) {
    console.warn("[student-cost] Invalid architecture data, using default");
    const defaultEstimate = {
      infraLevel: "Small",
      monthlyCostUSD: 50,
      engineeringEffort: "1-2 developers, 2-4 weeks",
      operationalRisk: "Low",
      explanation: ["Basic architecture - minimal cost"],
      source: "mock",
    };
    return NextResponse.json(defaultEstimate);
  }
  const context = getProjectContext(projectId);

  console.log("========================================");
  console.log("[student-cost] COST ESTIMATION REQUEST");
  console.log("  Project ID:", projectId);
  console.log("  Nodes count:", architecture.nodes?.length);
  console.log("  USE_REAL_AI:", AI_CONFIG.USE_REAL_AI);
  console.log("  API Key exists:", !!AI_CONFIG.OPENAI_API_KEY);
  console.log("========================================");

  if (AI_CONFIG.USE_REAL_AI) {
    try {
      console.log("[student-cost] ✅ Attempting real AI call...");
      
      const projectDef = projectDefinitionStore.get(projectId);
      const projectContext = projectDef 
        ? `Project: ${projectDef.name}\nGoal: ${projectDef.goal}`
        : "Student architecture project";
      
      const archDesc = `Components:\n${(architecture.nodes || []).map((n: any) => `- ${n.type}: ${n.label}`).join('\n')}`;
      
      const prompt = buildCostEstimationPrompt({
        projectContext,
        architecture: archDesc,
        teamSize: context.teamSize,
      });

      const systemPrompt = "You are a cloud infrastructure cost expert providing realistic pricing estimates for development projects.";
      
      const aiResult = await callOpenAI(systemPrompt, prompt);
      const aiCost = JSON.parse(aiResult.content);
      
      console.log("[student-cost] ✅✅✅ Real AI cost estimate generated!");
      console.log("  Monthly cost:", aiCost.monthlyCostUSD);
      
      return NextResponse.json({
        ...aiCost,
        source: "ai",
      });
    } catch (error) {
      console.error("========================================");
      console.error("[student-cost] ❌❌❌ AI CALL FAILED!");
      console.error("  Error:", error instanceof Error ? error.message : String(error));
      console.error("  Falling back to mock estimate");
      console.error("========================================");
      // Fall through to mock
    }
  } else {
    console.log("[student-cost] ⚠️ USE_REAL_AI is FALSE, using mock");
  }

  console.log("[student-cost] 📦 Using mock cost estimate");
  
  const mockEstimate = estimateCost(
    { nodes: architecture.nodes, edges: architecture.edges || [] },
    context.teamSize,
    false
  );

  return NextResponse.json({
    ...mockEstimate,
    source: "mock",
  });
}
