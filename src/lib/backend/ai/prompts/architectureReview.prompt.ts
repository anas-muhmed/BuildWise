/**
 * Architecture Review Prompt
 * Provides expert scoring and feedback on student architectures
 */

export function buildArchitectureReviewPrompt(input: {
  projectContext: string;
  architecture: string;
  decisions: string;
}): string {
  return `You are an expert software architect reviewing a student's system design.

PROJECT:
${input.projectContext}

ARCHITECTURE:
${input.architecture}

DECISIONS:
${input.decisions}

Provide a concise architecture review with scoring across 4 dimensions:

1. **Simplicity** (0-30 points): How easy is this to understand and build?
2. **Scalability** (0-25 points): Can it handle growth in users/data?
3. **Maintainability** (0-25 points): How easy to debug, update, and extend?
4. **Cost Efficiency** (0-20 points): Resource usage vs value delivered?

IMPORTANT: Keep all "reason" fields under 25 words each. Be concise.

Output valid JSON:
{
  "breakdown": {
    "simplicity": {"score": number, "max": 30, "reason": "string (max 25 words)"},
    "scalability": {"score": number, "max": 25, "reason": "string (max 25 words)"},
    "maintainability": {"score": number, "max": 25, "reason": "string (max 25 words)"},
    "cost": {"score": number, "max": 20, "reason": "string (max 25 words)"}
  },
  "total": number,
  "maxTotal": 100,
  "summary": "string (max 40 words overall assessment)"
}

Be constructive and educational. Focus on actionable insights.`;
}
