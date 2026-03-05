import { NextRequest, NextResponse } from "next/server";
import { architectureStore, projectDefinitionStore } from "@/lib/student-mode/store";
import { applyDecision } from "@/lib/student-mode/apply-decision";
import { DECISIONS } from "@/lib/student-mode/decisions-sim";
import { getAuthUserFromRequest } from "@/lib/backend/auth";
import { validateDecisionPayload } from "@/lib/validation/schemas";
import { AI_CONFIG } from "@/lib/backend/ai/config";
import { callOpenAI } from "@/lib/backend/ai/openaiProvider";
import { buildDecisionExplanationPrompt } from "@/lib/backend/ai/prompts/decisionExplanation.prompt";
import { getDecisionExplanationMock } from "@/lib/backend/ai/mocks/decisionExplanation.mock";

export async function POST(req: NextRequest) {
  // 🔒 Require authentication
  const user = getAuthUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  
  // Validate input
  const validation = validateDecisionPayload(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { projectId, decisionId } = validation.data!;

  const base = architectureStore.get(projectId);
  if (!base) {
    return NextResponse.json({ error: "Architecture not found" }, { status: 404 });
  }

  const updated = applyDecision(base, decisionId);
  architectureStore.set(projectId, updated);

  const decision = DECISIONS.find(d => d.id === decisionId);
  
  // Get AI-powered explanation or mock
  let explanation = decision?.effect.explanation || "";
  let scoreDelta = decision?.effect.scoreDelta || 5;
  let tradeoffs = null;
  let tip = null;

  if (AI_CONFIG.USE_REAL_AI) {
    try {
      console.log("[student-decision] Using real AI for decision explanation");
      
      const projectDef = projectDefinitionStore.get(projectId);
      const projectContext = projectDef 
        ? `Project: ${projectDef.name}\nDescription: ${projectDef.description}`
        : "Student architecture project";
      
      const currentArch = `Nodes: ${updated.nodes.map(n => n.label).join(", ")}`;
      
      const prompt = buildDecisionExplanationPrompt({
        decisionId,
        decisionLabel: decision?.label || decisionId,
        projectContext,
        currentArchitecture: currentArch,
      });

      const systemPrompt = "You are an expert software architect teaching students about system design. Provide clear, educational explanations.";
      
      const aiResult = await callOpenAI(systemPrompt, prompt);
      const parsed = JSON.parse(aiResult.content);
      
      explanation = parsed.explanation || explanation;
      scoreDelta = parsed.scoreDelta || scoreDelta;
      tradeoffs = parsed.tradeoffs || null;
      tip = parsed.tip || null;
      
      console.log("[student-decision] Real AI explanation generated successfully");
    } catch (error) {
      console.error("[student-decision] AI failed, using fallback:", error);
      // Fall back to hardcoded explanation
    }
  } else {
    console.log("[student-decision] Using mock explanation");
    const mockData = getDecisionExplanationMock(decisionId);
    explanation = mockData.explanation;
    scoreDelta = mockData.scoreDelta;
    tradeoffs = mockData.tradeoffs;
    tip = mockData.tip;
  }

  return NextResponse.json({
    architecture: updated,
    explanation,
    scoreDelta,
    tradeoffs,
    tip,
    source: AI_CONFIG.USE_REAL_AI ? "ai" : "mock",
  });
}
