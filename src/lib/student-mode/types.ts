export type NodeType =
  | "frontend"
  | "backend"
  | "database"
  | "auth"
  | "payment"
  | "realtime"
  | "cache"
  | "queue"
  | "load_balancer";

export type ArchitectureNode = {
  id: string;
  type: NodeType;
  label: string;
  reason: string; // ← THIS is your viva gold
};

export type ArchitectureEdge = {
  from: string;
  to: string;
  label?: string;
  type: "request" | "data" | "event";
};

export type ArchitectureGraph = {
  nodes: ArchitectureNode[];
  edges: ArchitectureEdge[];
};
