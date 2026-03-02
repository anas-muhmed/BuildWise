/**
 * BuildWise — Component Catalog
 *
 * Every architectural component a student can include in their design,
 * plus a requirement-mapper that tells the builder which are REQUIRED,
 * RECOMMENDED, OPTIONAL, or RISKY based on the student's reasoning answers.
 */

export type ComponentId =
  | "web-frontend"
  | "mobile-app"
  | "api-server"
  | "backend-worker"
  | "microservices"
  | "primary-db"
  | "read-replica"
  | "cache"
  | "load-balancer"
  | "api-gateway"
  | "cdn"
  | "object-storage"
  | "message-queue"
  | "auth-service"
  | "monitoring"
  | "waf";

export type ComponentStatus = "required" | "recommended" | "optional" | "risky";

export type ArchComponent = {
  id: ComponentId;
  name: string;
  icon: string; // emoji
  category: "Frontend" | "Backend" | "Database" | "Infrastructure" | "Security" | "Observability";
  description: string;  // one-line what it is
  whenToUse: string;    // one-line when you need it
  tradeOff: string;     // one-line cost/complexity note
  type: string;         // maps to Canvas node type
};

// ── Catalogue ───────────────────────────────────────────────────────────────

export const COMPONENTS: ArchComponent[] = [
  // Frontend
  {
    id: "web-frontend",
    name: "Web Frontend",
    icon: "🌐",
    category: "Frontend",
    description: "Browser-based UI (React, Vue, Next.js)",
    whenToUse: "Any system accessed from a desktop or mobile browser",
    tradeOff: "CDN caching needed at scale; SEO matters for public apps",
    type: "frontend",
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    icon: "📱",
    category: "Frontend",
    description: "Native or cross-platform mobile app (iOS/Android)",
    whenToUse: "When users need push notifications, offline use, or device sensors",
    tradeOff: "Requires separate build pipeline; app store review delays updates",
    type: "frontend",
  },

  // Backend
  {
    id: "api-server",
    name: "API Server",
    icon: "⚙️",
    category: "Backend",
    description: "Central REST or GraphQL server handling business logic",
    whenToUse: "Core of almost every system — processes requests and talks to DB",
    tradeOff: "Single server is a bottleneck at high load without horizontal scaling",
    type: "backend",
  },
  {
    id: "backend-worker",
    name: "Background Worker",
    icon: "🔄",
    category: "Backend",
    description: "Async processor that consumes tasks from a queue",
    whenToUse: "Needed whenever you have a message queue — processes jobs in background",
    tradeOff: "Pointless without a queue; adds operational complexity",
    type: "backend",
  },
  {
    id: "microservices",
    name: "Microservices",
    icon: "🧩",
    category: "Backend",
    description: "Multiple small, independently deployable backend services",
    whenToUse: "Large teams, different scaling needs per domain, independent deployments",
    tradeOff: "High operational overhead; bad for teams < 5 or beginners",
    type: "backend",
  },

  // Database
  {
    id: "primary-db",
    name: "Primary Database",
    icon: "🗄️",
    category: "Database",
    description: "Main data store (PostgreSQL, MySQL, MongoDB)",
    whenToUse: "Every system that persists data — non-negotiable for most apps",
    tradeOff: "Single point of failure without replica; needs backup strategy",
    type: "database",
  },
  {
    id: "read-replica",
    name: "Read Replica",
    icon: "📋",
    category: "Database",
    description: "Read-only DB copy for scaling reads and failover",
    whenToUse: "High read load, read/write ratio imbalance, or disaster recovery",
    tradeOff: "Replication lag means slight data staleness for read queries",
    type: "database",
  },
  {
    id: "cache",
    name: "Cache (Redis)",
    icon: "⚡",
    category: "Database",
    description: "In-memory store for fast reads and session management",
    whenToUse: "Hot data, sessions, rate limiting, real-time counters",
    tradeOff: "Data is volatile; not suitable as primary store; memory costs",
    type: "cache",
  },

  // Infrastructure
  {
    id: "load-balancer",
    name: "Load Balancer",
    icon: "⚖️",
    category: "Infrastructure",
    description: "Distributes traffic across multiple server instances",
    whenToUse: "High traffic, horizontal scaling, zero-downtime deployments",
    tradeOff: "Adds one network hop; needs health checks to route correctly",
    type: "loadbalancer",
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    icon: "🚪",
    category: "Infrastructure",
    description: "Single entry point for routing, rate limiting, SSL termination",
    whenToUse: "Microservices, multiple client types, public APIs needing rate limits",
    tradeOff: "Another network hop; latency overhead if misconfigured",
    type: "gateway",
  },
  {
    id: "cdn",
    name: "CDN",
    icon: "🌍",
    category: "Infrastructure",
    description: "Globally distributed cache for static assets and edge delivery",
    whenToUse: "Global users, high media/static asset traffic, reduces server load",
    tradeOff: "Cache invalidation is hard; not useful for highly dynamic content",
    type: "cdn",
  },
  {
    id: "object-storage",
    name: "Object Storage",
    icon: "📦",
    category: "Infrastructure",
    description: "Scalable file/media storage (S3, Azure Blob, GCS)",
    whenToUse: "User uploads, media files, backups — anything too large for DB",
    tradeOff: "Requires pre-signed URLs for security; egress costs add up",
    type: "storage",
  },
  {
    id: "message-queue",
    name: "Message Queue",
    icon: "📨",
    category: "Infrastructure",
    description: "Async event bus decoupling producers from consumers (RabbitMQ, SQS)",
    whenToUse: "Real-time events, async jobs, decoupling services, retry logic",
    tradeOff: "MUST have a worker to consume — a queue alone produces no results",
    type: "queue",
  },

  // Security
  {
    id: "auth-service",
    name: "Auth Service",
    icon: "🔐",
    category: "Security",
    description: "Authentication and authorisation (JWT, OAuth, Auth0)",
    whenToUse: "Any system with user accounts, protected resources, or payments",
    tradeOff: "Session management complexity; token expiry handling needed",
    type: "auth",
  },
  {
    id: "waf",
    name: "Web App Firewall",
    icon: "🛡️",
    category: "Security",
    description: "Filters malicious traffic: SQLi, XSS, DDoS mitigation",
    whenToUse: "Public-facing apps handling payments, PII, or regulated data",
    tradeOff: "False positives can block legitimate traffic; tuning required",
    type: "security",
  },

  // Observability
  {
    id: "monitoring",
    name: "Monitoring & Logging",
    icon: "📊",
    category: "Observability",
    description: "Metrics, alerts, and logs (Datadog, Prometheus, CloudWatch)",
    whenToUse: "Any production system — you cannot debug what you cannot observe",
    tradeOff: "Data volume costs; alert fatigue if thresholds badly tuned",
    type: "monitoring",
  },
];

// ── Requirement Mapper ───────────────────────────────────────────────────────

export type ComponentRequirements = {
  required:    { id: ComponentId; reason: string }[];
  recommended: { id: ComponentId; reason: string }[];
  risky:       { id: ComponentId; reason: string }[]; // risky to include alone
  mutuallyRequired: { if: ComponentId; thenAlso: ComponentId; reason: string }[];
};

export function getRequirements(answers: Record<string, string>): ComponentRequirements {
  const required:    ComponentRequirements["required"]    = [];
  const recommended: ComponentRequirements["recommended"] = [];
  const risky:       ComponentRequirements["risky"]       = [];
  const mutuallyRequired: ComponentRequirements["mutuallyRequired"] = [];

  // ── Always required ─────────────────────────────────────────────────────
  required.push({ id: "web-frontend", reason: "Every browser-accessible system needs a frontend." });
  required.push({ id: "api-server",   reason: "Core business logic lives in the API server." });
  required.push({ id: "primary-db",   reason: "Any system that stores data needs a database." });

  // ── User load ───────────────────────────────────────────────────────────
  if (answers.user_load === "high_users") {
    required.push({    id: "load-balancer", reason: "You selected High Users — a single server will bottleneck." });
    recommended.push({ id: "cache",         reason: "Cache reduces DB pressure under high load." });
    recommended.push({ id: "cdn",           reason: "CDN offloads static asset delivery globally." });
  }
  if (answers.user_load === "medium_users") {
    recommended.push({ id: "cache",         reason: "Cache prevents hot-path DB queries from slowing things down." });
  }

  // ── Data sensitivity ────────────────────────────────────────────────────
  if (answers.data_sensitivity === "payments" || answers.data_sensitivity === "auth_only") {
    required.push({ id: "auth-service", reason: `You handle ${answers.data_sensitivity === "payments" ? "payment / personal data" : "user accounts"} — authentication is mandatory.` });
  }
  if (answers.data_sensitivity === "payments") {
    recommended.push({ id: "waf", reason: "Payment systems require protection against injection and fraud." });
  }

  // ── Real-time ───────────────────────────────────────────────────────────
  if (answers.realtime === "realtime") {
    required.push({    id: "message-queue", reason: "Real-time push requires async event delivery via a queue." });
    required.push({    id: "cache",         reason: "Cache (Redis Pub/Sub) powers WebSocket broadcasting." });
    mutuallyRequired.push({ if: "message-queue", thenAlso: "backend-worker", reason: "A queue without a worker means messages pile up and never process." });
  }

  // ── Failure tolerance ───────────────────────────────────────────────────
  if (answers.failure === "self_heal") {
    required.push({    id: "monitoring",   reason: "Self-healing requires observing health metrics to trigger recovery." });
    recommended.push({ id: "read-replica", reason: "Replica allows failover when primary DB goes down." });
  }
  if (answers.failure === "partial_fail") {
    recommended.push({ id: "monitoring",   reason: "Partial failure detection requires alerting on service health." });
  }

  // ── Deployment ──────────────────────────────────────────────────────────
  if (answers.deployment === "cloud_scaling") {
    recommended.push({ id: "api-gateway",  reason: "Cloud deployments benefit from centralised routing and rate limiting." });
    recommended.push({ id: "monitoring",   reason: "Auto-scaling decisions are driven by real-time metrics." });
  }
  if (answers.system_type === "communication") {
    required.push({    id: "message-queue", reason: "Communication systems need async pub/sub or real-time messaging." });
    mutuallyRequired.push({ if: "message-queue", thenAlso: "backend-worker", reason: "Queue messages must be consumed by a worker." });
  }

  // ── Uploads ─────────────────────────────────────────────────────────────
  if (["communication", "informational"].includes(answers.system_type ?? "")) {
    recommended.push({ id: "object-storage", reason: "Media/file sharing requires scalable object storage." });
  }

  // ── Risky combos ────────────────────────────────────────────────────────
  risky.push({ id: "message-queue", reason: "A message queue without a Background Worker means messages are never consumed." });
  risky.push({ id: "microservices",  reason: "Microservices without a Load Balancer or API Gateway creates routing chaos." });

  // Deduplicate required (keep first occurrence)
  const seen = new Set<string>();
  const dedupedRequired = required.filter((r) => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  });

  return { required: dedupedRequired, recommended, risky, mutuallyRequired };
}

// ── Scoring ──────────────────────────────────────────────────────────────────

export type BuildScore = {
  score: number;       // 0–100
  missingRequired: ComponentId[];
  riskyIncluded:   ComponentId[];
  mutuallyMissing: { component: ComponentId; needsAlso: ComponentId; reason: string }[];
};

export function scoreBuild(
  selected: ComponentId[],
  requirements: ComponentRequirements
): BuildScore {
  const selectedSet = new Set(selected);

  const missingRequired = requirements.required
    .map((r) => r.id)
    .filter((id) => !selectedSet.has(id));

  const riskyIncluded = requirements.risky
    .map((r) => r.id)
    .filter((id) => selectedSet.has(id));

  const mutuallyMissing: BuildScore["mutuallyMissing"] = [];
  for (const mr of requirements.mutuallyRequired) {
    if (selectedSet.has(mr.if) && !selectedSet.has(mr.thenAlso)) {
      mutuallyMissing.push({
        component: mr.if,
        needsAlso: mr.thenAlso,
        reason: mr.reason,
      });
    }
  }

  const totalRequired = requirements.required.length;
  const covered = totalRequired - missingRequired.length;
  const penalty = riskyIncluded.length * 5 + mutuallyMissing.length * 10;
  const score = Math.max(
    0,
    Math.round((covered / Math.max(totalRequired, 1)) * 100) - penalty
  );

  return { score, missingRequired, riskyIncluded, mutuallyMissing };
}
