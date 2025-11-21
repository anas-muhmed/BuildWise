// lib/mockStudentGenerator.ts
export type Node = { id: string; label: string; x: number; y: number };
export type Edge = { source: string; target: string };

export function generateStudentArchitecture(opts: {
  appType: string;
  skillLevel: "beginner"|"intermediate"|"advanced";
  constraints?: { budget?: "low"|"medium"|"high"; usersPerMin?: number };
}) {
  const { skillLevel, constraints } = opts;
  // deterministic simple rules
  const base: { nodes: Node[]; edges: Edge[]; explanations: string[] } = {
    nodes: [],
    edges: [],
    explanations: [],
  };

  // helper placements
  const centerX = 320;
  const leftX = 120;
  const rightX = 520;

  // Basic mapping
  if (skillLevel === "beginner") {
    base.nodes = [
      { id: "frontend", label: "FRONTEND (web/mobile)", x: leftX, y: 120 },
      { id: "backend", label: "BACKEND (API)", x: centerX, y: 200 },
      { id: "db", label: "DATABASE", x: rightX, y: 280 },
    ];
    base.edges = [
      { source: "frontend", target: "backend" },
      { source: "backend", target: "db" },
    ];
    base.explanations = [
      "Frontend: user-facing UI (web or mobile).",
      "Backend: handles business logic and API endpoints.",
      "Database: stores persistent data (e.g., users, items).",
    ];
  } else if (skillLevel === "intermediate") {
    base.nodes = [
      { id: "frontend", label: "FRONTEND", x: leftX, y: 80 },
      { id: "cdn", label: "CDN (optional)", x: leftX, y: 40 },
      { id: "api", label: "API GATEWAY", x: centerX, y: 120 },
      { id: "services", label: "SERVICE (auth/order)", x: centerX, y: 220 },
      { id: "db", label: "DB + cache", x: rightX, y: 300 },
    ];
    base.edges = [
      { source: "frontend", target: "api" },
      { source: "api", target: "services" },
      { source: "services", target: "db" },
    ];
    base.explanations = [
      "CDN for static assets (helps performance but optional).",
      "API Gateway centralizes routing and security.",
      "Services represent separated responsibilities (auth, orders).",
    ];
  } else {
    // advanced
    base.nodes = [
      { id: "frontend", label: "FRONTEND", x: leftX, y: 60 },
      { id: "lb", label: "LOAD BALANCER", x: 260, y: 80 },
      { id: "api", label: "API GATEWAY", x: centerX, y: 120 },
      { id: "auth", label: "AUTH SERVICE", x: centerX, y: 200 },
      { id: "order", label: "ORDER SERVICE", x: 420, y: 200 },
      { id: "mq", label: "MESSAGE BROKER", x: 320, y: 260 },
      { id: "db", label: "DATABASE (replicated)", x: rightX, y: 320 },
      { id: "cache", label: "REDIS CACHE", x: 520, y: 240 },
    ];
    base.edges = [
      { source: "frontend", target: "lb" },
      { source: "lb", target: "api" },
      { source: "api", target: "auth" },
      { source: "api", target: "order" },
      { source: "order", target: "mq" },
      { source: "order", target: "db" },
      { source: "order", target: "cache" },
    ];
    base.explanations = [
      "Load balancer distributes traffic to multiple backend instances.",
      "Message broker decouples long-running tasks and improves reliability.",
      "Replicated DB provides read-scaling and fault tolerance.",
    ];
  }

  // apply constraint hints (budget)
  if (constraints?.budget === "low") {
    base.explanations.push("Constraint: budget=low — prefer serverless and fewer components.");
  }
  if ((constraints?.usersPerMin || 0) > 1000) {
    base.explanations.push("High traffic hint: add caching and horizontal scaling.");
  }

  // mock score (simple)
  const aiScore = skillLevel === "beginner" ? 75 : skillLevel === "intermediate" ? 82 : 88;

  return {
    nodes: base.nodes,
    edges: base.edges,
    explanations: base.explanations,
    metadata: { generator: "mock-v1", aiScore },
  };
}
