/**
 * Cost Estimation Prompt
 * Generates realistic infrastructure and engineering cost estimates
 */

export function buildCostEstimationPrompt(input: {
  projectContext: string;
  architecture: string;
  teamSize: number;
}): string {
  return `You are a cloud infrastructure cost expert estimating deployment costs.

PROJECT:
${input.projectContext}

ARCHITECTURE:
${input.architecture}

TEAM SIZE: ${input.teamSize} developers

Estimate the monthly infrastructure cost and engineering effort for this system.

Consider:
- Cloud hosting (VPS, serverless, containers)
- Database (managed service vs self-hosted)
- Cache, queues, CDN, monitoring
- Development and operational complexity

Output valid JSON:
{
  "infraLevel": "Low" | "Medium" | "High",
  "monthlyCostUSD": "string (range like $20-$40)",
  "engineeringEffort": "Low" | "Medium" | "High",
  "operationalRisk": "Low" | "Medium" | "High",
  "explanation": ["string", "string", "string"]
}

Provide realistic estimates based on AWS/DigitalOcean/Vercel pricing for small-medium projects.`;
}
