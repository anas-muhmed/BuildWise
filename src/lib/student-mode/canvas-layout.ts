import { ArchitectureGraph } from "./types";
import { CanvasGraph, CanvasNode, CanvasEdge } from "./canvas-types";

const X_GAP = 200;
const Y_GAP = 160;

export function projectToCanvas(
  architecture: ArchitectureGraph
): CanvasGraph {
  console.log("[projectToCanvas] Input architecture:", architecture);
  
  const nodes: CanvasNode[] = [];

  const edges: CanvasEdge[] = (architecture.edges || []).map(edge => ({
    from: edge.from,
    to: edge.to,
    label: edge.label,
  }));

  const columns: Record<string, number> = {
    frontend: 0,
    load_balancer: 1,
    backend: 2,
    auth: 2,
    realtime: 2,
    queue: 3,
    payment: 3,
    database: 4,
  };

  const rowTracker: Record<number, number> = {};

  for (const node of architecture.nodes) {
    const col = columns[node.type] ?? 2;
    const row = rowTracker[col] ?? 0;

    const canvasNode = {
      id: node.id,
      label: node.label,
      type: node.type,
      x: 40 + col * X_GAP,
      y: 80 + row * Y_GAP,
    };
    
    nodes.push(canvasNode);
    console.log("[projectToCanvas] Created node:", canvasNode);

    rowTracker[col] = row + 1;
  }

  const result = { nodes, edges };
  console.log("[projectToCanvas] Output graph:", result);
  return result;
}
