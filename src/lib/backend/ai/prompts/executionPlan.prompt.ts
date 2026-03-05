/**
 * Execution Plan Prompt
 * Generates detailed implementation blueprint for student projects
 */

export function buildExecutionPlanPrompt(input: {
  projectContext: string;
  architecture: string;
}): string {
  return `You are a technical lead creating an implementation plan for a development team.

PROJECT:
${input.projectContext}

ARCHITECTURE:
${input.architecture}

Generate a practical, step-by-step execution blueprint for building this system.

Include:
1. **System Overview**: How components interact (3-5 bullet points)
2. **Component Responsibilities**: What each part does
3. **Development Phases**: Logical build sequence (3-4 phases)
4. **Technical Risks**: Potential challenges
5. **Next Steps**: Concrete actions to start development

Output valid JSON:
{
  "systemOverview": ["string", "string", "string"],
  "components": [
    {"name": "string", "type": "string", "responsibilities": ["string", "string"]}
  ],
  "developmentPhases": [
    {"phase": "string", "tasks": ["string", "string", "string"]}
  ],
  "risks": ["string", "string", "string"],
  "nextSteps": ["string", "string", "string"]
}

Make it actionable for beginner-to-intermediate developers.`;
}
