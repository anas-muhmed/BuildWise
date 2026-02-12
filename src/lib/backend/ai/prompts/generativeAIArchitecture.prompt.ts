/**
 * GENERATIVE AI ARCHITECTURE PROMPT
 * 
 * Purpose: Controls AI behavior when proposing initial production architectures
 * Mode: Generative AI (architect, decisive, proposal-oriented)
 * 
 * This prompt is responsible for:
 * - Reading GenerativeAIContext (systemBrief + constraints + priorities)
 * - Proposing a complete initial architecture
 * - Expressing decisions as a locked decision ledger
 * - Preparing data for Proposal page, Builder page, and snapshot creation
 * 
 * This prompt must NOT:
 * - Ask questions back
 * - Teach fundamentals
 * - Over-explain basics
 * - Hedge excessively
 * 
 * Contract: Returns { decisions, architecture, assumptions }
 */

import { GenerativeAIContext, renderGenerativeContextAsText } from "../context/generativeAIContextBuilder";

/**
 * GENERATIVE AI ARCHITECTURE PROMPT
 * 
 * Structure:
 * 1. Role - Defines AI persona (senior architect)
 * 2. Task - What to produce (complete architecture proposal)
 * 3. Constraints - What to avoid (over-engineering)
 * 4. Output Format - Exact JSON structure required
 */
export const GENERATIVE_AI_ARCHITECTURE_PROMPT = `
You are a senior software architect designing production-ready systems.
You make clear, justified architectural decisions based on given constraints.
You do not over-engineer and you avoid unnecessary complexity.

TASK:

Based on the provided project context, propose a complete high-level system architecture.

Your proposal should:
- Select an appropriate frontend, backend, database, and supporting services
- Justify each decision using the given constraints and priorities
- Consider scalability, cost, and team capability
- Be suitable as an initial production architecture

CONSTRAINTS:

Do NOT:
- Over-engineer the system
- Introduce microservices unless clearly required
- Assume unlimited budget or large teams
- Add technologies not justified by the context
- Suggest tools purely for popularity
- Design for hypothetical future scale without evidence

OUTPUT FORMAT:

You must return a JSON object with this exact structure:

{
  "decisions": [
    {
      "category": "frontend | backend | database | auth | payments | realtime | cache | messaging | storage | deployment | other",
      "choice": "string",
      "reasoning": "string",
      "alternatives": ["string", "string"],
      "confidence": "high | medium | low"
    }
  ],
  "architecture": {
    "modules": [
      {
        "name": "string",
        "responsibility": "string",
        "depends_on": ["string"]
      }
    ]
  },
  "assumptions": ["string", "string"]
}

Field Descriptions:

**decisions**: Array of architectural decisions
- category: Type of decision (frontend, backend, database, auth, payments, realtime, cache, messaging, storage, deployment, other)
- choice: The selected technology or architectural approach (be concise and specific)
- reasoning: Why this choice fits the given context
- alternatives: What other options you considered
- confidence: Your confidence level based on the constraints

**architecture.modules**: High-level system components
- name: Module name (e.g., "User Management", "Payment Processing")
- responsibility: What this module does
- depends_on: Array of other module names this depends on

**assumptions**: Array of assumptions you made about scope or requirements

CRITICAL RULES:

1. Every decision must be justified using the given context
2. Decisions must be realistic for the given team and budget
3. Keep the number of modules manageable (4-8 modules typically)
4. All values in "depends_on" must exactly match names defined in the modules list
5. Return ONLY valid JSON
6. Do not include explanations outside the JSON
7. Do not use markdown code fences
8. Do not add conversational text

`;

/**
 * Builds the complete prompt by combining the base prompt with the project context
 * 
 * @param context - The GenerativeAIContext containing systemBrief, constraints, and priorities
 * @returns Complete prompt string ready for AI consumption
 */
export function buildGenerativeAIArchitecturePrompt(context: GenerativeAIContext): string {
  const contextText = renderGenerativeContextAsText(context);
  
  return `${GENERATIVE_AI_ARCHITECTURE_PROMPT}

PROJECT CONTEXT:
${contextText}
`;
}

/**
 * TYPE DEFINITIONS
 * 
 * These types define the expected output contract from the AI.
 * They must match the UI requirements for Proposal page and Builder page.
 */

export type DecisionCategory = 
  | "frontend" 
  | "backend" 
  | "database" 
  | "auth" 
  | "payments" 
  | "realtime" 
  | "cache"
  | "messaging"
  | "storage"
  | "deployment"
  | "other";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface ArchitecturalDecision {
  category: DecisionCategory;
  choice: string;
  reasoning: string;
  alternatives: string[];
  confidence: ConfidenceLevel;
}

export interface ArchitectureModule {
  name: string;
  responsibility: string;
  depends_on: string[];
}

export interface GenerativeAIArchitectureResponse {
  decisions: ArchitecturalDecision[];
  architecture: {
    modules: ArchitectureModule[];
  };
  assumptions: string[];
}
