import { ArchitectureNode } from "./types";

export function explainNode(node: ArchitectureNode) {
  return {
    title: node.label,
    explanation: node.reason || "No explanation provided.",
    type: node.type,
  };
}
