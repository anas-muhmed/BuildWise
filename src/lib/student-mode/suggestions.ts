import { ArchitectureScore } from "./score-engine";

export type Suggestion = {
  id: string;
  title: string;
  reason: string;
  impact: {
    simplicity?: number;
    scalability?: number;
    maintainability?: number;
    cost?: number;
  };
};

type SuggestionInput = {
  nodes: Array<{ id: string; type: string; label: string }>;
  edges: Array<{ from: string; to: string; type: string }>;
  decisions: {
    backendType?: "monolith" | "microservices";
  };
  context: {
    teamSize: number;
    experienceLevel: "beginner" | "intermediate";
  };
  score: ArchitectureScore;
};

export function generateSuggestions(input: SuggestionInput): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Rule 1: Microservices with small team → suggest monolith
  if (
    input.decisions.backendType === "microservices" &&
    input.context.teamSize < 3
  ) {
    suggestions.push({
      id: "switch-to-monolith",
      title: "Replace Microservices with Modular Monolith",
      reason: "Team size too small to manage independent services effectively",
      impact: {
        simplicity: 10,
        maintainability: 10,
        cost: 5,
        scalability: -5,
      },
    });
  }

  // Rule 2: No load balancer + microservices → suggest adding one
  const hasLoadBalancer = input.nodes.some(n => n.type === "load_balancer");
  if (
    input.decisions.backendType === "microservices" &&
    !hasLoadBalancer &&
    input.context.teamSize >= 3
  ) {
    suggestions.push({
      id: "add-load-balancer",
      title: "Add Load Balancer",
      reason: "Microservices need traffic distribution for scalability",
      impact: {
        scalability: 5,
        cost: -3,
      },
    });
  }

  // Rule 3: No cache → suggest caching
  const hasCache = input.nodes.some(n => n.type === "cache");
  const hasDatabase = input.nodes.some(n => n.type === "database");
  if (!hasCache && hasDatabase) {
    suggestions.push({
      id: "add-cache",
      title: "Add Caching Layer",
      reason: "Reduce database load and improve response times",
      impact: {
        scalability: 3,
        cost: -2,
      },
    });
  }

  // Rule 4: No queue with async operations → suggest queue
  const hasQueue = input.nodes.some(n => n.type === "queue");
  const hasPaymentGateway = input.nodes.some(n => n.type === "payment_gateway");
  if (!hasQueue && hasPaymentGateway) {
    suggestions.push({
      id: "add-queue",
      title: "Add Message Queue",
      reason: "Handle payment processing asynchronously for reliability",
      impact: {
        scalability: 4,
        maintainability: 3,
        cost: -3,
      },
    });
  }

  // Rule 5: Frontend directly to database → suggest API layer
  const hasFrontend = input.nodes.some(n => n.type === "frontend");
  const hasBackend = input.nodes.some(n => n.type === "backend");
  const frontendToDbEdge = input.edges.some(
    e => {
      const from = input.nodes.find(n => n.id === e.from);
      const to = input.nodes.find(n => n.id === e.to);
      return from?.type === "frontend" && to?.type === "database";
    }
  );

  if (hasFrontend && !hasBackend && frontendToDbEdge) {
    suggestions.push({
      id: "add-backend-layer",
      title: "Add Backend API Layer",
      reason: "Direct frontend-to-database access creates security and maintainability issues",
      impact: {
        maintainability: 8,
        simplicity: -3,
      },
    });
  }

  // Rule 6: Beginner + complex architecture → simplify
  if (
    input.context.experienceLevel === "beginner" &&
    input.nodes.length > 6
  ) {
    suggestions.push({
      id: "simplify-architecture",
      title: "Reduce Architecture Complexity",
      reason: "Too many components for beginner experience level",
      impact: {
        simplicity: 8,
        maintainability: 6,
      },
    });
  }

  // Rule 7: Low scalability score → suggest improvements
  if (input.score.breakdown.scalability.score < input.score.breakdown.scalability.max * 0.5) {
    if (!hasLoadBalancer) {
      suggestions.push({
        id: "improve-scalability-lb",
        title: "Add Load Balancer for Horizontal Scaling",
        reason: "Single backend instance limits scalability",
        impact: {
          scalability: 5,
          cost: -3,
        },
      });
    }
  }

  // Rule 8: Over-engineered for team size → suggest simplification
  if (
    input.nodes.length > input.context.teamSize * 4 &&
    input.context.teamSize <= 2
  ) {
    suggestions.push({
      id: "reduce-overengineering",
      title: "Consolidate Components",
      reason: "Too many components for small team to maintain",
      impact: {
        simplicity: 7,
        maintainability: 5,
        cost: 6,
      },
    });
  }

  // Deduplicate suggestions by ID
  const uniqueSuggestions = Array.from(
    new Map(suggestions.map(s => [s.id, s])).values()
  );

  return uniqueSuggestions;
}
