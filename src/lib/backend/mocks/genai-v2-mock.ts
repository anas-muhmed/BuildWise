// lib/backend/mocks/genai-v2-mock.ts

/**
 * 🎯 PHASE 3: Stable Mock Layer
 * Master's Ideology: Canonical LLM outputs for predictable frontend development
 * 
 * Use these mocks to:
 * - Develop frontend without backend dependency
 * - Test UI components with realistic data
 * - Demonstrate Phase 3 flow without real LLM calls
 */

export interface MockModule {
  _id: string;
  project_id: string;
  name: string;
  description?: string;
  order: number;
  status: "proposed" | "approved" | "modified" | "rejected";
  nodes: {
    id: string;
    type: string;
    label: string;
    meta?: Record<string, unknown>;
  }[];
  edges: {
    from: string;
    to: string;
    label?: string;
  }[];
  rationale?: string;
  ai_feedback?: {
    confidence: "high" | "medium" | "low";
    alternatives?: string[];
    resources?: string[];
    raw_llm_output?: string;
  };
  created_by: string;
  approved_by?: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface MockSnapshot {
  _id: string;
  project_id: string;
  version: number;
  modules: string[];
  nodes: {
    id: string;
    type: string;
    label: string;
    meta?: Record<string, unknown>;
  }[];
  edges: {
    from: string;
    to: string;
    label?: string;
  }[];
  active: boolean;
  created_by: string;
  created_at: string;
}

// Mock Project ID (consistent across all mocks)
export const MOCK_PROJECT_ID = "mock_project_6925989bbe55f01b3130be98";
export const MOCK_USER_ID = "mock_user_123";

/**
 * Module 1: Authentication & User Management
 * Status: Approved | Confidence: High
 */
export const MOCK_MODULE_AUTH: MockModule = {
  _id: "mock_module_auth_001",
  project_id: MOCK_PROJECT_ID,
  name: "Authentication & User Management",
  description: "User signup, login, JWT sessions, profile management, and OAuth integration",
  order: 1,
  status: "approved",
  nodes: [
    {
      id: "mobile_app",
      type: "client",
      label: "Mobile App",
      meta: { platform: "React Native", screens: ["Login", "Signup", "Profile"] }
    },
    {
      id: "api_gateway",
      type: "gateway",
      label: "API Gateway",
      meta: { type: "Kong", rate_limiting: true, auth_middleware: true }
    },
    {
      id: "auth_service",
      type: "auth",
      label: "Auth Service",
      meta: { strategy: "JWT", token_expiry: "24h", refresh_tokens: true }
    },
    {
      id: "user_database",
      type: "database",
      label: "User Database",
      meta: { engine: "mongodb", collections: ["users", "sessions", "oauth_tokens"] }
    }
  ],
  edges: [
    { from: "mobile_app", to: "api_gateway", label: "HTTPS" },
    { from: "api_gateway", to: "auth_service", label: "Auth endpoints" },
    { from: "auth_service", to: "user_database", label: "User CRUD" }
  ],
  rationale:
    "Authentication is the foundation of any user-facing app. This module establishes secure user identity verification using industry-standard JWT tokens. The API gateway acts as a single entry point, enforcing rate limiting and routing requests to the auth service. MongoDB provides flexible schema for user profiles and session management.",
  ai_feedback: {
    confidence: "high",
    alternatives: [
      "Firebase Authentication (managed service, less control)",
      "Auth0 integration (third-party, subscription cost)",
      "Passport.js with session cookies (stateful, less scalable)"
    ],
    resources: [
      "https://jwt.io/introduction",
      "https://auth0.com/docs/secure/tokens/json-web-tokens",
      "https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html"
    ],
    raw_llm_output: JSON.stringify({
      module_name: "Authentication & User Management",
      nodes: [
        { id: "mobile_app", type: "client", label: "Mobile App" },
        { id: "api_gateway", type: "gateway", label: "API Gateway" },
        { id: "auth_service", type: "auth", label: "Auth Service" },
        { id: "user_database", type: "database", label: "User Database" }
      ],
      edges: [
        { from: "mobile_app", to: "api_gateway" },
        { from: "api_gateway", to: "auth_service" },
        { from: "auth_service", to: "user_database" }
      ],
      rationale: "Authentication foundation with JWT",
      confidence: "high"
    })
  },
  created_by: MOCK_USER_ID,
  approved_by: MOCK_USER_ID,
  version: 2,
  created_at: "2025-11-25T10:00:00.000Z",
  updated_at: "2025-11-25T10:15:00.000Z"
};

/**
 * Module 2: Order Processing & Payment
 * Status: Proposed | Confidence: Medium
 */
export const MOCK_MODULE_ORDER: MockModule = {
  _id: "mock_module_order_002",
  project_id: MOCK_PROJECT_ID,
  name: "Order Processing & Payment",
  description: "End-to-end order placement, validation, payment processing, and fulfillment tracking",
  order: 2,
  status: "proposed",
  nodes: [
    {
      id: "api_gateway",
      type: "gateway",
      label: "API Gateway",
      meta: { endpoints: ["/orders", "/payments"] }
    },
    {
      id: "order_service",
      type: "service",
      label: "Order Service",
      meta: { language: "Node.js", framework: "Express", responsibilities: ["validation", "orchestration"] }
    },
    {
      id: "payment_service",
      type: "service",
      label: "Payment Service",
      meta: { provider: "Stripe", supports: ["credit_card", "wallet"], pci_compliant: true }
    },
    {
      id: "order_database",
      type: "database",
      label: "Orders DB",
      meta: { engine: "mongodb", collections: ["orders", "order_items", "payments"] }
    },
    {
      id: "payment_queue",
      type: "queue",
      label: "Payment Queue",
      meta: { type: "Redis", pattern: "pub-sub", use_case: "async_payment_processing" }
    }
  ],
  edges: [
    { from: "api_gateway", to: "order_service", label: "Create Order" },
    { from: "order_service", to: "payment_service", label: "Process Payment" },
    { from: "order_service", to: "order_database", label: "Store Order" },
    { from: "payment_service", to: "payment_queue", label: "Async Job" },
    { from: "payment_queue", to: "order_database", label: "Update Status" }
  ],
  rationale:
    "Order processing is the core revenue-generating flow. This module separates order orchestration (Order Service) from payment processing (Payment Service) for modularity. The payment queue handles asynchronous operations like payment confirmations, refunds, and webhook processing from Stripe. MongoDB stores order history with embedded items for fast retrieval.",
  ai_feedback: {
    confidence: "medium",
    alternatives: [
      "Monolithic approach (combine order + payment service, simpler but less scalable)",
      "Serverless (AWS Lambda + DynamoDB, pay-per-use but vendor lock-in)",
      "Event sourcing pattern (complete audit trail but complex implementation)"
    ],
    resources: [
      "https://stripe.com/docs/payments",
      "https://microservices.io/patterns/data/saga.html",
      "https://aws.amazon.com/blogs/compute/building-scalable-serverless-microservices/"
    ]
  },
  created_by: MOCK_USER_ID,
  version: 1,
  created_at: "2025-11-25T10:20:00.000Z",
  updated_at: "2025-11-25T10:20:00.000Z"
};

/**
 * Module 3: Real-time Tracking & Notifications
 * Status: Proposed | Confidence: High
 */
export const MOCK_MODULE_REALTIME: MockModule = {
  _id: "mock_module_realtime_003",
  project_id: MOCK_PROJECT_ID,
  name: "Real-time Tracking & Notifications",
  description: "Live order tracking with WebSocket updates and push notifications for order status changes",
  order: 3,
  status: "proposed",
  nodes: [
    {
      id: "mobile_app",
      type: "client",
      label: "Mobile App",
      meta: { supports_websocket: true, push_enabled: true }
    },
    {
      id: "websocket_server",
      type: "realtime",
      label: "WebSocket Server",
      meta: { library: "Socket.io", rooms: ["order_updates", "driver_location"] }
    },
    {
      id: "notification_service",
      type: "service",
      label: "Notification Service",
      meta: { provider: "FCM", platforms: ["iOS", "Android"] }
    },
    {
      id: "tracking_database",
      type: "database",
      label: "Tracking DB",
      meta: { engine: "mongodb", collections: ["locations", "events"], ttl: "7_days" }
    },
    {
      id: "redis_cache",
      type: "cache",
      label: "Redis Cache",
      meta: { use_case: "active_connections", ttl: "1h" }
    }
  ],
  edges: [
    { from: "mobile_app", to: "websocket_server", label: "WebSocket" },
    { from: "websocket_server", to: "redis_cache", label: "Connection State" },
    { from: "websocket_server", to: "tracking_database", label: "Persist Events" },
    { from: "notification_service", to: "mobile_app", label: "Push Notification" },
    { from: "websocket_server", to: "notification_service", label: "Trigger Push" }
  ],
  rationale:
    "Real-time features are critical for modern delivery apps. WebSocket provides bi-directional communication for live order tracking. Redis caches active connections to avoid database hits on every location update. FCM sends push notifications when users aren't actively connected. This architecture scales to millions of concurrent connections.",
  ai_feedback: {
    confidence: "high",
    alternatives: [
      "Server-Sent Events (SSE) - simpler but one-way only",
      "Long polling - fallback for older browsers but inefficient",
      "GraphQL subscriptions - modern but requires GraphQL setup"
    ],
    resources: [
      "https://socket.io/docs/v4/",
      "https://firebase.google.com/docs/cloud-messaging",
      "https://redis.io/docs/manual/pubsub/"
    ]
  },
  created_by: MOCK_USER_ID,
  version: 1,
  created_at: "2025-11-25T10:30:00.000Z",
  updated_at: "2025-11-25T10:30:00.000Z"
};

/**
 * Module 4: Search & Discovery
 * Status: Proposed | Confidence: Low (needs review)
 */
export const MOCK_MODULE_SEARCH: MockModule = {
  _id: "mock_module_search_004",
  project_id: MOCK_PROJECT_ID,
  name: "Search & Discovery",
  description: "Full-text search for products, restaurants, and menu items with filters and autocomplete",
  order: 4,
  status: "proposed",
  nodes: [
    {
      id: "api_gateway",
      type: "gateway",
      label: "API Gateway"
    },
    {
      id: "search_service",
      type: "search",
      label: "Search Service",
      meta: { engine: "Elasticsearch", indices: ["products", "restaurants", "menu_items"] }
    },
    {
      id: "product_database",
      type: "database",
      label: "Product DB",
      meta: { engine: "mongodb", sync_to_elasticsearch: true }
    }
  ],
  edges: [
    { from: "api_gateway", to: "search_service", label: "Search Query" },
    { from: "search_service", to: "product_database", label: "Sync Data" }
  ],
  rationale:
    "Search is essential for large catalogs. Elasticsearch provides fast full-text search with relevance scoring, filters, and autocomplete. Data syncs from MongoDB to Elasticsearch for indexing. This module might have performance concerns for very large datasets - consider sharding strategy.",
  ai_feedback: {
    confidence: "low",
    alternatives: [
      "Algolia (managed service, faster setup but expensive at scale)",
      "MongoDB Atlas Search (integrated with MongoDB but less powerful)",
      "Typesense (open-source, simpler than Elasticsearch)"
    ],
    resources: [
      "https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html",
      "https://www.algolia.com/doc/",
      "https://typesense.org/docs/"
    ]
  },
  created_by: MOCK_USER_ID,
  version: 1,
  created_at: "2025-11-25T10:40:00.000Z",
  updated_at: "2025-11-25T10:40:00.000Z"
};

/**
 * Module 5: Infrastructure & Monitoring
 * Status: Modified | Confidence: Medium
 */
export const MOCK_MODULE_INFRA: MockModule = {
  _id: "mock_module_infra_005",
  project_id: MOCK_PROJECT_ID,
  name: "Infrastructure & Monitoring",
  description: "CDN, logging, monitoring, alerting, and DevOps infrastructure for production deployment",
  order: 5,
  status: "modified",
  nodes: [
    {
      id: "cdn",
      type: "cdn",
      label: "CDN",
      meta: { provider: "Cloudflare", caching: "assets_and_api", ddos_protection: true }
    },
    {
      id: "monitoring",
      type: "monitoring",
      label: "Monitoring",
      meta: { tools: ["Datadog", "Sentry"], metrics: ["latency", "errors", "throughput"] }
    },
    {
      id: "api_gateway",
      type: "gateway",
      label: "API Gateway",
      meta: { rate_limiting: true, logging: "all_requests" }
    }
  ],
  edges: [
    { from: "cdn", to: "api_gateway", label: "Cache & Route" },
    { from: "api_gateway", to: "monitoring", label: "Send Metrics" }
  ],
  rationale:
    "Production infrastructure needs observability. CDN reduces latency for global users and absorbs DDoS attacks. Monitoring tools provide real-time alerts for errors and performance degradation. This module was modified to add Sentry for error tracking.",
  ai_feedback: {
    confidence: "medium",
    alternatives: [
      "AWS CloudWatch (native AWS monitoring)",
      "New Relic (all-in-one APM platform)",
      "Prometheus + Grafana (open-source, self-hosted)"
    ],
    resources: [
      "https://www.datadoghq.com/",
      "https://docs.sentry.io/",
      "https://www.cloudflare.com/learning/cdn/what-is-a-cdn/"
    ]
  },
  created_by: MOCK_USER_ID,
  version: 2,
  created_at: "2025-11-25T10:50:00.000Z",
  updated_at: "2025-11-25T11:00:00.000Z"
};

/**
 * All Mock Modules (for list views)
 */
export const MOCK_MODULES: MockModule[] = [
  MOCK_MODULE_AUTH,
  MOCK_MODULE_ORDER,
  MOCK_MODULE_REALTIME,
  MOCK_MODULE_SEARCH,
  MOCK_MODULE_INFRA
];

/**
 * Mock Snapshot v1 (After approving Module 1: Auth)
 */
export const MOCK_SNAPSHOT_V1: MockSnapshot = {
  _id: "mock_snapshot_v1",
  project_id: MOCK_PROJECT_ID,
  version: 1,
  modules: ["mock_module_auth_001"],
  nodes: MOCK_MODULE_AUTH.nodes,
  edges: MOCK_MODULE_AUTH.edges,
  active: false,
  created_by: MOCK_USER_ID,
  created_at: "2025-11-25T10:15:00.000Z"
};

/**
 * Mock Snapshot v2 (After approving Module 2: Order)
 */
export const MOCK_SNAPSHOT_V2: MockSnapshot = {
  _id: "mock_snapshot_v2",
  project_id: MOCK_PROJECT_ID,
  version: 2,
  modules: ["mock_module_auth_001", "mock_module_order_002"],
  nodes: [
    ...MOCK_MODULE_AUTH.nodes,
    ...MOCK_MODULE_ORDER.nodes.filter(n => n.id !== "api_gateway") // Dedupe gateway
  ],
  edges: [
    ...MOCK_MODULE_AUTH.edges,
    ...MOCK_MODULE_ORDER.edges
  ],
  active: false,
  created_by: MOCK_USER_ID,
  created_at: "2025-11-25T10:25:00.000Z"
};

/**
 * Mock Snapshot v3 (Latest - After approving Module 3: Realtime)
 */
export const MOCK_SNAPSHOT_V3: MockSnapshot = {
  _id: "mock_snapshot_v3",
  project_id: MOCK_PROJECT_ID,
  version: 3,
  modules: ["mock_module_auth_001", "mock_module_order_002", "mock_module_realtime_003"],
  nodes: [
    ...MOCK_MODULE_AUTH.nodes,
    ...MOCK_MODULE_ORDER.nodes.filter(n => n.id !== "api_gateway"),
    ...MOCK_MODULE_REALTIME.nodes.filter(n => n.id !== "mobile_app") // Dedupe client
  ],
  edges: [
    ...MOCK_MODULE_AUTH.edges,
    ...MOCK_MODULE_ORDER.edges,
    ...MOCK_MODULE_REALTIME.edges
  ],
  active: true,
  created_by: MOCK_USER_ID,
  created_at: "2025-11-25T10:35:00.000Z"
};

/**
 * All Mock Snapshots (for history views)
 */
export const MOCK_SNAPSHOTS: MockSnapshot[] = [
  MOCK_SNAPSHOT_V3, // Latest first
  MOCK_SNAPSHOT_V2,
  MOCK_SNAPSHOT_V1
];

/**
 * Mock Conflict Example (for admin review queue)
 */
export const MOCK_CONFLICT_REVIEW = {
  _id: "mock_review_001",
  project_id: MOCK_PROJECT_ID,
  module_id: "mock_module_search_004",
  snapshot_version: 3,
  conflicts: [
    {
      type: "database_plurality",
      message: "Multiple database engines detected: mongodb, elasticsearch",
      details: {
        engines: ["mongodb", "elasticsearch"]
      }
    },
    {
      type: "low_confidence",
      message: "Module has low AI confidence (requires manual review)",
      details: {
        confidence: "low",
        module_name: "Search & Discovery"
      }
    }
  ],
  status: "pending",
  created_at: "2025-11-25T10:40:00.000Z"
};

/**
 * Helper: Get mock module by ID
 */
export function getMockModuleById(moduleId: string): MockModule | null {
  return MOCK_MODULES.find(m => m._id === moduleId) || null;
}

/**
 * Helper: Get latest mock snapshot
 */
export function getLatestMockSnapshot(): MockSnapshot {
  return MOCK_SNAPSHOT_V3;
}

/**
 * Helper: Get mock snapshot by version
 */
export function getMockSnapshotByVersion(version: number): MockSnapshot | null {
  const snapshots = [MOCK_SNAPSHOT_V1, MOCK_SNAPSHOT_V2, MOCK_SNAPSHOT_V3];
  return snapshots.find(s => s.version === version) || null;
}

/**
 * Helper: Simulate LLM output for a given feature
 */
export function generateMockLLMOutput(featureName: string) {
  return {
    module_name: featureName,
    nodes: [
      { id: "api_gateway", type: "gateway", label: "API Gateway" },
      { id: `${featureName.toLowerCase().replace(/\s+/g, "_")}_service`, type: "service", label: `${featureName} Service` },
      { id: "database", type: "database", label: "Database", meta: { engine: "mongodb" } }
    ],
    edges: [
      { from: "api_gateway", to: `${featureName.toLowerCase().replace(/\s+/g, "_")}_service` },
      { from: `${featureName.toLowerCase().replace(/\s+/g, "_")}_service`, to: "database" }
    ],
    rationale: `Implements ${featureName} functionality with REST API and data persistence.`,
    confidence: "medium" as const
  };
}
