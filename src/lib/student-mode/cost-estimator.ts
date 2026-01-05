import { CanvasGraph } from "./canvas-types";

export type CostEstimate = {
  infraLevel: "Low" | "Medium" | "High";
  monthlyCostUSD: string;
  engineeringEffort: "Low" | "Medium" | "High";
  operationalRisk: "Low" | "Medium" | "High";
  explanation: string[];
};

export function estimateCost(
  graph: CanvasGraph,
  teamSize: number,
  constraintsEnabled: boolean
): CostEstimate {
  const nodeTypes = graph.nodes.map(n => n.type);

  const hasCache = nodeTypes.includes("cache");
  const hasQueue = nodeTypes.includes("queue");
  const hasMicroservices = nodeTypes.filter(t => t === "backend").length > 1;
  const hasRealtime = nodeTypes.includes("realtime");

  let infraScore = 1;

  if (hasCache) infraScore += 1;
  if (hasQueue) infraScore += 1;
  if (hasMicroservices) infraScore += 2;
  if (hasRealtime) infraScore += 1;
  if (constraintsEnabled) infraScore += 1;

  let infraLevel: CostEstimate["infraLevel"] = "Low";
  let monthlyCostUSD = "$20 – $40";

  if (infraScore >= 4 && infraScore <= 6) {
    infraLevel = "Medium";
    monthlyCostUSD = "$60 – $120";
  }

  if (infraScore > 6) {
    infraLevel = "High";
    monthlyCostUSD = "$150 – $300";
  }

  let engineeringEffort: CostEstimate["engineeringEffort"] =
    teamSize <= 2 ? "Low" : teamSize <= 4 ? "Medium" : "High";

  let operationalRisk: CostEstimate["operationalRisk"] =
    infraScore > 6 ? "High" : infraScore >= 4 ? "Medium" : "Low";

  const explanation: string[] = [
    `Architecture contains ${graph.nodes.length} components.`,
    hasMicroservices
      ? "Multiple backend services increase deployment complexity."
      : "Single backend keeps deployment simple.",
    hasCache ? "Cache improves performance but adds operational overhead." : "",
    hasQueue ? "Queue enables async processing but needs monitoring." : "",
    constraintsEnabled
      ? "Constraints enforce best practices but raise infra cost."
      : "No strict constraints applied."
  ].filter(Boolean);

  return {
    infraLevel,
    monthlyCostUSD,
    engineeringEffort,
    operationalRisk,
    explanation
  };
}
