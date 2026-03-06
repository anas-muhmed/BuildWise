import { NextRequest, NextResponse } from "next/server";
import { architectureStore, projectDefinitionStore, reasoningStore } from "@/lib/student-mode/store";
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
      maxTotal: 100,
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
      maxTotal: 100,
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

  console.log("========================================");
  console.log("[student-score] SCORE REQUEST");
  console.log("  Project ID:", projectId);
  console.log("  Nodes count:", architecture.nodes?.length);
  console.log("  USE_REAL_AI:", AI_CONFIG.USE_REAL_AI);
  console.log("  API Key exists:", !!AI_CONFIG.OPENAI_API_KEY);
  console.log("========================================");

  if (AI_CONFIG.USE_REAL_AI) {
    try {
      console.log("[student-score] ✅ Attempting real AI call...");
      
      const projectDef = projectDefinitionStore.get(projectId);
      const reasoning = reasoningStore.get(projectId);
      
      // Build comprehensive context
      const projectContext = projectDef 
        ? `Name: ${projectDef.name}\nGoal: ${projectDef.goal}\nTeam: ${context.teamSize} developers (${context.experienceLevel})`
        : `Team: ${context.teamSize} developers (${context.experienceLevel})`;
      
      // Include student's requirements from reasoning
      const requirements = reasoning?.answers ? `
Student Requirements:
- System type: ${reasoning.answers.system_type || 'not specified'}
- User load: ${reasoning.answers.user_load || 'not specified'} 
- Real-time needs: ${reasoning.answers.realtime || 'not specified'}
- Data sensitivity: ${reasoning.answers.data_sensitivity || 'not specified'}
- Failure tolerance: ${reasoning.answers.failure || 'not specified'}
- Deployment: ${reasoning.answers.deployment || 'not specified'}
- Team experience: ${reasoning.answers.team || 'not specified'}` : '';
      
      // Show both base and final architecture
      const baseNodes = state.baseArchitecture?.nodes || [];
      const finalNodes = architecture.nodes || [];
      const baseDesc = `Starting architecture (${baseNodes.length} components):\n${baseNodes.map((n: any) => `- ${n.type}: ${n.label || n.id}`).join('\n')}`;
      const finalDesc = `Final architecture (${finalNodes.length} components):\n${finalNodes.map((n: any) => `- ${n.type}: ${n.label || n.id}`).join('\n')}\n\nConnections: ${architecture.edges?.length || 0} integrations`;
      
      const archDesc = baseNodes.length !== finalNodes.length 
        ? `${baseDesc}\n\n${finalDesc}\n\nEvolution: Student added ${finalNodes.length - baseNodes.length} components based on design decisions`
        : finalDesc;
      
      const activeDecisions = state.activeDecisions || [];
      const decisionsDesc = activeDecisions.length > 0
        ? `Design decisions made: ${activeDecisions.join(', ')}`
        : "No additional design decisions made yet";
      
      const prompt = buildArchitectureReviewPrompt({
        projectContext: projectContext + requirements,
        architecture: archDesc,
        decisions: decisionsDesc,
      });

      const systemPrompt = "You are an expert software architect providing constructive feedback to students learning system design. Score based on how well their architecture matches their stated requirements.";
      
      const aiResult = await callOpenAI(systemPrompt, prompt, 1500); // Higher limit for detailed breakdown with 4 categories + summary
      const aiScore = JSON.parse(aiResult.content);
      
      console.log("[student-score] ✅✅✅ Real AI review generated!");
      console.log("  Total score:", aiScore.total);
      
      return NextResponse.json({
        ...aiScore,
        source: "ai",
      });
    } catch (error) {
      console.error("========================================");
      console.error("[student-score] ❌❌❌ AI CALL FAILED!");
      console.error("  Error:", error instanceof Error ? error.message : String(error));
      console.error("  Falling back to mock score");
      console.error("========================================");
      // Fall through to mock
    }
  } else {
    console.log("[student-score] ⚠️ USE_REAL_AI is FALSE, using mock");
  }

  console.log("[student-score] Using mock score");
  return NextResponse.json({
    ...mockScore,
    source: "mock",
  });
}
