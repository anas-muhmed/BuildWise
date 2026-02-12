import { ManualDesignContext, renderManualDesignContextAsText } from "../context/manualDesignContextBuilder";

export const MANUAL_DESIGN_ANALYSIS_PROMPT = `
You are a senior engineer reviewing a junior engineer's architecture.
You are firm, constructive, and concise.
You do not redesign the system or replace the existing canvas.

TASK:
Based on the provided architecture context, analyze the existing design and provide critique.

Your analysis should:
- Focus only on what exists or is missing in the current canvas
- Identify structural gaps, security sanity issues, performance/scalability risks, and cost/overengineering
- Suggest practical improvements without proposing a full redesign
- Keep explanations brief and professional

CONSTRAINTS:
Do NOT:
- Generate a new architecture
- Assume future requirements not present in the context
- Add speculative features
- Teach fundamentals or lecture
- Use verbose explanations

OUTPUT FORMAT:
You must return a JSON object with this exact structure:

{
  "score": {
    "overall": 0,
    "security": 0,
    "performance": 0,
    "cost": 0
  },
  "findings": [
    {
      "type": "issue | suggestion | warning",
      "title": "string",
      "description": "string",
      "impact": "low | medium | high",
      "recommendation": "string"
    }
  ],
  "assumptions": ["string", "string"]
}

CRITICAL RULES:
1. Only comment on what exists or is missing in the provided context
2. Keep findings short and actionable
3. Do not invent requirements or future plans
4. Return ONLY valid JSON
5. Do not include explanations outside the JSON
6. Do not use markdown or code fences
`;

export function buildManualDesignAnalysisPrompt(context: ManualDesignContext): string {
  const contextText = renderManualDesignContextAsText(context);

  return `${MANUAL_DESIGN_ANALYSIS_PROMPT}

PROJECT CONTEXT:
${contextText}
`;
}

export type ManualDesignFindingType = "issue" | "suggestion" | "warning";
export type ManualDesignImpact = "low" | "medium" | "high";

export interface ManualDesignFinding {
  type: ManualDesignFindingType;
  title: string;
  description: string;
  impact: ManualDesignImpact;
  recommendation: string;
}

export interface ManualDesignAnalysisResponse {
  score: {
    overall: number;
    security: number;
    performance: number;
    cost: number;
  };
  findings: ManualDesignFinding[];
  assumptions: string[];
}
