/**
 * Decision Explanation Prompt
 * Generates architectural reasoning for student decisions
 */

export function buildDecisionExplanationPrompt(input: {
  decisionId: string;
  decisionLabel: string;
  projectContext: string;
  currentArchitecture: string;
}): string {
  return `You are an expert software architect teaching students about system design decisions.

PROJECT CONTEXT:
${input.projectContext}

CURRENT ARCHITECTURE:
${input.currentArchitecture}

DECISION: ${input.decisionLabel}

Generate a clear, educational explanation for this architectural decision. Focus on:
1. **Why this matters**: Core benefit of this decision
2. **Tradeoffs**: What you gain vs what you sacrifice
3. **When to use**: Ideal scenarios for this choice
4. **Beginner tip**: One practical insight for students

Output valid JSON:
{
  "explanation": "string (2-3 sentences explaining the decision)",
  "tradeoffs": {
    "benefits": ["string", "string"],
    "costs": ["string", "string"]
  },
  "scoreDelta": number (0-15, representing architecture quality improvement),
  "tip": "string (1 sentence practical advice)"
}`;
}
