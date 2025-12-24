// src/lib/backend/services/studentGenerator.ts
import { nanoid } from "nanoid";

/**
 * Mock deterministic generator for Student Mode.
 * Produces:
 * - roles: backend, frontend, cloud, docs
 * - milestones and tasks based on selected features & skill level
 * - step generation: returns next nodes/edges + textual explanation + implementation guide
 *
 * Keep this deterministic so frontend tests are stable.
 */

export function generateRolesAndMilestones({ appType, skillLevel, selectedFeatures }: { appType: string; skillLevel: string; selectedFeatures: string[] }) {
  void appType; // For future extensibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const roles: any[] = [
    { title: "Backend", description: "APIs, business logic", tasks: [] },
    { title: "Frontend", description: "Client UI", tasks: [] },
    { title: "Cloud/DevOps", description: "Deploy, infra", tasks: [] },
    { title: "Docs/QA", description: "Docs, testing", tasks: [] }
  ];

  const milestones = [
    { id: `M1-${nanoid(6)}`, title: "M1: Core features", description: "Auth, basic CRUD", done: false },
    { id: `M2-${nanoid(6)}`, title: "M2: Integrations", description: "Payments/Notifications if selected", done: false },
    { id: `M3-${nanoid(6)}`, title: "M3: Polish & QA", description: "Monitoring, testing, docs", done: false }
  ];

  // feature-aware tasks
  const features = selectedFeatures || [];

  // backend tasks
  const backendTasks = [
    { id: nanoid(6), title: "Design API schema", done: false },
    { id: nanoid(6), title: "Implement auth (JWT sessions)", done: false }
  ];
  if (features.includes("payments")) backendTasks.push({ id: nanoid(6), title: "Integrate Stripe (sandbox)", done: false });
  if (features.includes("notifications")) backendTasks.push({ id: nanoid(6), title: "Add push notifications", done: false });

  roles[0].tasks = backendTasks;

  // frontend tasks
  const frontendTasks = [
    { id: nanoid(6), title: "Scaffold app (React/React Native)", done: false },
    { id: nanoid(6), title: "Implement listing & detail pages", done: false }
  ];
  if (skillLevel === "beginner") frontendTasks.push({ id: nanoid(6), title: "Use simple state + fetch", done: false });
  roles[1].tasks = frontendTasks;

  // devops tasks
  const devopsTasks = [
    { id: nanoid(6), title: "Create deployment pipeline", done: false },
    { id: nanoid(6), title: "Setup staging environment", done: false }
  ];
  roles[2].tasks = devopsTasks;

  // docs tasks
  roles[3].tasks = [{ id: nanoid(6), title: "Write README and runbook", done: false }];

  return { roles, milestones };
}

export function generateNextStep({ currentStepsLength, appType, skillLevel, selectedFeatures }: { currentStepsLength: number; appType: string; skillLevel: string; selectedFeatures: string[] }) {
  // Use parameters for future extensibility
  void appType; void selectedFeatures;
  // simple progressive module generation: discovery -> orders -> payments -> tracking
  const featureMap = ["core", "orders", "payments", "real-time", "analytics"];
  const idx = Math.min(currentStepsLength, featureMap.length - 1);
  const key = featureMap[idx];

  const nodes = [];
  const edges = [];
  let explanation = "";
  let implementationGuide = "";

  if (key === "core") {
    nodes.push({ id: `mobile_app`, type: "client", label: "Mobile App" });
    nodes.push({ id: `api_gateway`, type: "gateway", label: "API Gateway" });
    nodes.push({ id: `restaurant_service`, type: "service", label: "Restaurant Service" });
    edges.push({ from: "mobile_app", to: "api_gateway" }, { from: "api_gateway", to: "restaurant_service" });
    explanation = "Core discovery flow: browsing and selecting items.";
    implementationGuide = (skillLevel === "beginner") ? "Implement using Express + PostgreSQL. Keep layers simple." : "Use Node.js microservice + PostgreSQL/Redis as needed.";
  } else if (key === "orders") {
    nodes.push({ id: `order_service`, type: "service", label: "Order Service" });
    nodes.push({ id: `payment_service`, type: "service", label: "Payment Service" });
    nodes.push({ id: `postgres`, type: "database", label: "Postgres" });
    edges.push({ from: "order_service", to: "payment_service" }, { from: "order_service", to: "postgres" });
    explanation = "Order processing and persistence.";
    implementationGuide = "Ensure idempotency in order processing; use transactions for finality.";
  } else if (key === "payments") {
    nodes.push({ id: `stripe`, type: "external", label: "Stripe" });
    nodes.push({ id: `payment_service`, type: "service", label: "Payment Service" });
    edges.push({ from: "payment_service", to: "stripe" });
    explanation = "Payments: stripe integration.";
    implementationGuide = "Use Stripe test keys; add webhooks for payment confirmation.";
  } else if (key === "real-time") {
    nodes.push({ id: `websocket_server`, type: "service", label: "WebSocket Server" });
    nodes.push({ id: `redis`, type: "cache", label: "Redis" });
    edges.push({ from: "order_service", to: "websocket_server" }, { from: "websocket_server", to: "redis" });
    explanation = "Real-time tracking for order status.";
    implementationGuide = "Use WebSockets or Socket.IO; use Redis for pub/sub.";
  } else {
    nodes.push({ id: `analytics_service`, type: "service", label: "Analytics" });
    edges.push({ from: "api_gateway", to: "analytics_service" });
    explanation = "Analytics and monitoring.";
    implementationGuide = "Collect events and send to analytics backend. Keep sampling low initially.";
  }

  return {
    step: currentStepsLength + 1,
    nodes,
    edges,
    explanations: explanation,
    implementationGuide
  };
}
