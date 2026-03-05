/**
 * Architecture Suggestions Prompt
 * Generates improvement suggestions for student architectures
 */

export function buildSuggestionsPrompt(input: {
  projectContext: string;
  architecture: string;
  decisions: string;
  score: string;
}): string {
  return `You are an expert software architect reviewing a student's system design.

PROJECT:
${input.projectContext}

CURRENT ARCHITECTURE:
${input.architecture}

DECISIONS MADE:
${input.decisions}

CURRENT SCORE:
${input.score}

Generate 2-4 specific, actionable suggestions to improve this architecture. Each suggestion should:
1. Be concrete and implementable
2. Explain the reasoning clearly
3. Show the impact on architecture quality

Output valid JSON:
{
  "suggestions": [
    {
      "id": "string (kebab-case)",
      "title": "string (short, actionable)",
      "reason": "string (why this matters)",
      "impact": {
        "simplicity": number (optional, -10 to +10),
        "scalability": number (optional, -10 to +10),
        "maintainability": number (optional, -10 to +10),
        "cost": number (optional, -10 to +10)
      }
    }
  ]
}

Focus on beginner-friendly suggestions that match the team size and experience level.`;
}
