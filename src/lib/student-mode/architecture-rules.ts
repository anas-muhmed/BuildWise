import { ArchitectureGraph } from "./types";

type Answers = Record<string, string>;

export function buildArchitecture(
  projectId: string,
  answers: Answers
): ArchitectureGraph {
  const nodes = [];
  const edges = [];

  // Always present
  nodes.push({
    id: "frontend",
    type: "frontend",
    label: "Frontend App",
    reason: "Users interact with the system via UI",
  });

  // Transactional or auth implies backend
  if (
    answers.system_type === "transactional" ||
    answers.data_sensitivity !== "no_sensitive"
  ) {
    nodes.push({
      id: "backend",
      type: "backend",
      label: "Backend API",
      reason: "Handles business logic and secure operations",
    });

    edges.push({
      from: "frontend",
      to: "backend",
      label: "API calls",
      type: "request" as const,
    });
  }

  // Database rules
  if (
    answers.system_type === "transactional" ||
    answers.system_type === "informational"
  ) {
    nodes.push({
      id: "database",
      type: "database",
      label: "Primary Database",
      reason: "Persistent storage for application data",
    });

    edges.push({
      from: "backend",
      to: "database",
      label: "Read / Write",
      type: "data" as const,
    });
  }

  // Auth
  if (
    answers.data_sensitivity === "auth_only" ||
    answers.data_sensitivity === "payments"
  ) {
    nodes.push({
      id: "auth",
      type: "auth",
      label: "Authentication Service",
      reason: "Secures user identity and access",
    });

    edges.push({ from: "frontend", to: "auth", type: "request" as const });
    edges.push({ from: "auth", to: "backend", type: "request" as const });
  }

  // Payments
  if (answers.data_sensitivity === "payments") {
    nodes.push({
      id: "payment",
      type: "payment",
      label: "Payment Gateway",
      reason: "Handles secure financial transactions",
    });

    edges.push({ from: "backend", to: "payment", type: "request" as const });
  }

  // Real-time
  if (answers.realtime === "realtime") {
    nodes.push({
      id: "realtime",
      type: "realtime",
      label: "WebSocket Server",
      reason: "Provides real-time updates to users",
    });

    edges.push({ from: "frontend", to: "realtime", type: "event" as const });
    edges.push({ from: "realtime", to: "backend", type: "event" as const });
  }

  // Failure handling
  if (answers.failure === "self_heal") {
    nodes.push({
      id: "queue",
      type: "queue",
      label: "Message Queue",
      reason: "Ensures retry and fault tolerance",
    });

    edges.push({ from: "backend", to: "queue", type: "event" as const });
  }

  // Scaling
  if (answers.deployment === "cloud_scaling") {
    nodes.push({
      id: "lb",
      type: "load_balancer",
      label: "Load Balancer",
      reason: "Distributes traffic across services",
    });

    edges.push({ from: "frontend", to: "lb", type: "request" as const });
    edges.push({ from: "lb", to: "backend", type: "request" as const });
  }

  return { nodes, edges };
}
