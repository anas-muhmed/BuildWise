export type ScoreCategory = "simplicity" | "scalability" | "maintainability" | "cost";

export type ArchitectureScore = {
  total: number;
  maxTotal: number;
  breakdown: {
    simplicity: { score: number; max: number; reason: string };
    scalability: { score: number; max: number; reason: string };
    maintainability: { score: number; max: number; reason: string };
    cost: { score: number; max: number; reason: string };
  };
};

type ScoringInput = {
  nodes: Array<{ id: string; type: string; label: string }>;
  edges: Array<{ from: string; to: string; type: string }>;
  decisions: {
    backendType?: "monolith" | "microservices";
  };
  context: {
    teamSize: number;
    experienceLevel: "beginner" | "intermediate";
  };
};

export function scoreArchitecture(input: ScoringInput): ArchitectureScore {
  const simplicity = scoreSimplicity(input);
  const scalability = scoreScalability(input);
  const maintainability = scoreMaintainability(input);
  const cost = scoreCost(input);

  return {
    total: simplicity.score + scalability.score + maintainability.score + cost.score,
    maxTotal: simplicity.max + scalability.max + maintainability.max + cost.max,
    breakdown: {
      simplicity,
      scalability,
      maintainability,
      cost,
    },
  };
}

function scoreSimplicity(input: ScoringInput) {
  const max = 30;
  let score = max;
  let reason = "Simple, straightforward architecture";

  const { backendType } = input.decisions;
  const { teamSize, experienceLevel } = input.context;

  // Microservices with small team → complexity penalty
  if (backendType === "microservices" && teamSize < 3) {
    score -= 10;
    reason = "Microservices add complexity for small teams";
  }

  // Beginners with complex architecture → penalty
  if (experienceLevel === "beginner" && backendType === "microservices") {
    score -= 8;
    reason = "Complex architecture for beginner experience level";
  }

  // Too many nodes for team size → penalty
  const nodeCount = input.nodes.length;
  if (nodeCount > teamSize * 3) {
    score -= 5;
    reason = "Too many components for team to manage";
  }

  // Bonus for monolith with small team
  if (backendType === "monolith" && teamSize <= 2) {
    score = max;
    reason = "Optimal simplicity for small team";
  }

  return { score: Math.max(0, score), max, reason };
}

function scoreScalability(input: ScoringInput) {
  const max = 25;
  let score = 15; // baseline
  let reason = "Basic scalability setup";

  const hasLoadBalancer = input.nodes.some(n => n.type === "load_balancer");
  const hasQueue = input.nodes.some(n => n.type === "queue");
  const hasCache = input.nodes.some(n => n.type === "cache");
  const { backendType } = input.decisions;

  if (hasLoadBalancer) {
    score += 5;
    reason = "Load balancer enables horizontal scaling";
  }

  if (hasQueue) {
    score += 3;
    reason = "Queue allows async processing and load smoothing";
  }

  if (hasCache) {
    score += 2;
    reason = "Caching reduces database load";
  }

  // Microservices inherently more scalable
  if (backendType === "microservices") {
    score += 5;
    reason = "Microservices allow independent scaling of services";
  }

  return { score: Math.min(score, max), max, reason };
}

function scoreMaintainability(input: ScoringInput) {
  const max = 25;
  let score = max;
  let reason = "Clean, maintainable structure";

  const { backendType } = input.decisions;
  const { teamSize, experienceLevel } = input.context;
  const serviceCount = input.nodes.filter(n => n.type === "backend").length;

  // Microservices without enough team members → hard to maintain
  if (backendType === "microservices" && teamSize < serviceCount) {
    score -= 10;
    reason = "Not enough team members to own each service";
  }

  // Too many edges (high coupling) → maintenance burden
  const edgeCount = input.edges.length;
  if (edgeCount > input.nodes.length * 2) {
    score -= 5;
    reason = "High coupling makes changes difficult";
  }

  // Beginners with complex setup → maintenance issues
  if (experienceLevel === "beginner" && backendType === "microservices") {
    score -= 8;
    reason = "Complex architecture difficult for beginners to maintain";
  }

  // Bonus: monolith with small team
  if (backendType === "monolith" && teamSize <= 3) {
    score = max;
    reason = "Simple codebase easy to maintain with small team";
  }

  return { score: Math.max(0, score), max, reason };
}

function scoreCost(input: ScoringInput) {
  const max = 20;
  let score = max;
  let reason = "Cost-efficient architecture";

  const { backendType } = input.decisions;
  const { teamSize } = input.context;
  const nodeCount = input.nodes.length;

  // Over-engineering penalty
  if (nodeCount > 10 && teamSize <= 2) {
    score -= 8;
    reason = "Over-engineered for team size → high infrastructure costs";
  }

  // Microservices → higher ops cost
  if (backendType === "microservices") {
    score -= 5;
    reason = "Microservices require more infrastructure and monitoring";
  }

  // Unnecessary complexity → cost
  const hasQueue = input.nodes.some(n => n.type === "queue");
  const hasLoadBalancer = input.nodes.some(n => n.type === "load_balancer");
  if ((hasQueue || hasLoadBalancer) && teamSize === 1) {
    score -= 3;
    reason = "Advanced infrastructure unnecessary for single developer";
  }

  // Bonus: minimal setup
  if (backendType === "monolith" && nodeCount <= 5) {
    score = max;
    reason = "Minimal infrastructure keeps costs low";
  }

  return { score: Math.max(0, score), max, reason };
}
