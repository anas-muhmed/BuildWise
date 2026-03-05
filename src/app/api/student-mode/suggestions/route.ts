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
