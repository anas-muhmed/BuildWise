import { ArchitectureGraph } from "./types";
import { CanvasGraph, CanvasNode, CanvasEdge } from "./canvas-types";

const X_GAP = 380;
const Y_GAP = 180;
const START_X = 80;
const START_Y = 120;

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

  // Smart column assignment for logical flow
  const columns: Record<string, number> = {
    frontend: 0,
    "web-frontend": 0,
    "mobile-app": 0,
    cdn: 0,
    
    "load-balancer": 1,
    "api-gateway": 1,
    waf: 1,
    
    backend: 2,
    "api-server": 2,
    microservices: 2,
    "backend-worker": 2,
    "auth-service": 2,
    realtime: 2,
    
    cache: 3,
    queue: 3,
    "message-queue": 3,
    payment: 3,
    "object-storage": 3,
    monitoring: 3,
    
    database: 4,
    "primary-db": 4,
    "read-replica": 4,
  };

  // Group nodes by column
  const nodesByColumn: Map<number, typeof architecture.nodes> = new Map();
  
  for (const node of architecture.nodes) {
    const col = columns[node.type] ?? columns[node.id] ?? 2;
    if (!nodesByColumn.has(col)) {
      nodesByColumn.set(col, []);
    }
    nodesByColumn.get(col)!.push(node);
  }

  // Calculate positions with vertical centering per column
  for (const [col, colNodes] of nodesByColumn.entries()) {
    const totalHeight = (colNodes.length - 1) * Y_GAP;
    const startYForColumn = START_Y + (400 - totalHeight) / 2; // Center vertically
    
    colNodes.forEach((node, rowIndex) => {
      const canvasNode = {
        id: node.id,
        label: node.label,
        type: node.type,
        x: START_X + col * X_GAP,
        y: Math.max(START_Y, startYForColumn + rowIndex * Y_GAP),
      };
      
      nodes.push(canvasNode);
      console.log("[projectToCanvas] Created node:", canvasNode);
    });
  }

  const result = { nodes, edges };
  console.log("[projectToCanvas] Output graph:", result);
  return result;
}
