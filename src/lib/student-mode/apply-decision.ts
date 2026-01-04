import { DECISIONS } from "./decisions-sim";

type ArchitectureGraph = {
  nodes: Array<{ id: string; type: string; label: string }>;
  edges: Array<{ from: string; to: string; type: string }>;
};

export function applyDecision(
  base: ArchitectureGraph,
  decisionId: string
): ArchitectureGraph {
  const decision = DECISIONS.find(d => d.id === decisionId);
  if (!decision) return base;

  let nodes = [...base.nodes];
  let edges = [...base.edges];

  // Remove nodes
  if (decision.effect.removeNodes) {
    const removedNodeIds = nodes
      .filter(n => decision.effect.removeNodes!.includes(n.type))
      .map(n => n.id);

    nodes = nodes.filter(
      n => !decision.effect.removeNodes!.includes(n.type)
    );

    // Remove edges connected to removed nodes
    edges = edges.filter(
      e => !removedNodeIds.includes(e.from) && !removedNodeIds.includes(e.to)
    );
  }

  // Add nodes
  if (decision.effect.addNodes) {
    decision.effect.addNodes.forEach(nodeSpec => {
      const newNodeId = `${nodeSpec.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      nodes.push({
        id: newNodeId,
        type: nodeSpec.type,
        label: nodeSpec.label
      });

      // Auto-connect new nodes to existing architecture
      if (nodeSpec.type === "cache") {
        // Cache connects between backend and database
        const backend = nodes.find(n => n.type === "backend");
        const database = nodes.find(n => n.type === "database");
        if (backend && database) {
          edges.push({
            from: backend.id,
            to: newNodeId,
            type: "data"
          });
          edges.push({
            from: newNodeId,
            to: database.id,
            type: "data"
          });
        }
      }

      if (nodeSpec.type === "queue") {
        // Queue connects backend to async workers
        const backend = nodes.find(n => n.type === "backend");
        if (backend) {
          edges.push({
            from: backend.id,
            to: newNodeId,
            type: "event"
          });
        }
      }

      if (nodeSpec.type === "database" && nodeSpec.label === "Read Replica") {
        // Read replica connects to primary database
        const primaryDb = nodes.find(n => n.type === "database" && n.label !== "Read Replica");
        if (primaryDb) {
          edges.push({
            from: primaryDb.id,
            to: newNodeId,
            type: "data"
          });
        }
      }
    });
  }

  return {
    nodes,
    edges
  };
}
