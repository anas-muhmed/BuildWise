import { NextRequest, NextResponse } from "next/server";
import { architectureStore, projectDefinitionStore } from "@/lib/student-mode/store";
import { getDecisions } from "@/lib/student-mode/decisions/store";
import { getProjectContext } from "@/lib/student-mode/context";
import { scoreArchitecture } from "@/lib/student-mode/score-engine";
import { generateSuggestions } from "@/lib/student-mode/suggestions";
import { AI_CONFIG } from "@/lib/backend/ai/config";
import { callOpenAI } from "@/lib/backend/ai/openaiProvider";
import { buildSuggestionsPrompt } from "@/lib/backend/ai/prompts/suggestions.prompt";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get("projectId");

  if (!projectId) {
    console.warn("[student-suggestions] Missing projectId");
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  console.log("[student-suggestions] Fetching suggestions for projectId:", projectId);
  const state = architectureStore.get(projectId);
  console.log("[student-suggestions] Architecture store state:", state);

  if (!state) {
    console.warn("[student-suggestions] Architecture not found in store, using default suggestions");
    // Return default suggestions instead of 404
    const defaultSuggestions = {
      suggestions: [
        {
          id: "add-cache",
          title: "Implement Caching Mechanism",
          reason: "Caching frequently accessed data reduces database load and improves response times",
          impact: { scalability: 3, cost: -1, simplicity: -1 },
        },
        {
          id: "add-load-balancer",
          title: "Add Load Balancer",
          reason: "Distributes traffic across multiple servers for better reliability and performance",
          impact: { scalability: 4, reliability: 3, cost: 2 },
        },
      ],
      source: "mock",
    };
    return NextResponse.json(defaultSuggestions);
  }

  const architecture = state.architecture || state.baseArchitecture || state;
  
  if (!architecture || !architecture.nodes) {
    console.warn("[student-suggestions] Invalid architecture data, using default");
    const defaultSuggestions = {
      suggestions: [
        {
          id: "define-architecture",
          title: "Define Architecture Components",
          reason: "Start by selecting the core components your system needs",
          impact: { simplicity: 2 },
        },
      ],
      source: "mock",
    };
    return NextResponse.json(defaultSuggestions);
  }

  const decisions = getDecisions(projectId);
  const context = getProjectContext(projectId);

  const score = scoreArchitecture({
    nodes: architecture.nodes,
    edges: architecture.edges,
    decisions,
    context,
  });

  let suggestions;

  if (AI_CONFIG.USE_REAL_AI) {
    try {
      console.log("[student-suggestions] Using real AI for suggestions");
      
      const projectDef = projectDefinitionStore.get(projectId);
      const projectContext = projectDef 
        ? `Name: ${projectDef.name}\nDescription: ${projectDef.description}\nTeam: ${context.teamSize} developers (${context.experienceLevel})`
        : `Team: ${context.teamSize} developers (${context.experienceLevel})`;
      
      const archDesc = `Nodes: ${architecture.nodes.map(n => `${n.type} (${n.label})`).join(", ")}\nEdges: ${architecture.edges.length} connections`;
      const decisionsDesc = Object.entries(decisions).map(([k, v]) => `${k}: ${v}`).join(", ") || "None";
      const scoreDesc = `Total: ${score.total}/${score.max}\nBreakdown: ${Object.entries(score.breakdown).map(([k,v]) => `${k} ${v.score}/${v.max}`).join(", ")}`;
      
      const prompt = buildSuggestionsPrompt({
        projectContext,
        architecture: archDesc,
        decisions: decisionsDesc,
        score: scoreDesc,
      });

      const systemPrompt = "You are an expert software architect mentoring students on system design improvements.";
      
      const aiResult = await callOpenAI(systemPrompt, prompt);
      const parsed = JSON.parse(aiResult.content);
      
      suggestions = parsed.suggestions || [];
      console.log("[student-suggestions] Real AI suggestions generated successfully");
    } catch (error) {
      console.error("[student-suggestions] AI failed, using fallback:", error);
      // Fall back to rule-based suggestions
      suggestions = generateSuggestions({
        nodes: architecture.nodes,
        edges: architecture.edges,
        decisions,
        context,
        score,
      });
    }
  } else {
    console.log("[student-suggestions] Using mock suggestions");
    suggestions = generateSuggestions({
      nodes: architecture.nodes,
      edges: architecture.edges,
      decisions,
      context,
      score,
    });
  }

  return NextResponse.json({
    suggestions,
    source: AI_CONFIG.USE_REAL_AI ? "ai" : "mock",
  });
}
