import { applyDecision } from "./apply-decision";

type ArchitectureGraph = {
  nodes: Array<{ id: string; type: string; label: string }>;
  edges: Array<{ from: string; to: string; type: string }>;
};

export function recomputeArchitecture(
  base: ArchitectureGraph,
  decisions: string[]
): ArchitectureGraph {
  // Deep clone to avoid mutations
  let graph: ArchitectureGraph = structuredClone(base);

  // Apply decisions in order
  for (const decisionId of decisions) {
    graph = applyDecision(graph, decisionId);
  }

  return graph;
}
