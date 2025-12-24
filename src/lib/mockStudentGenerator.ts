// lib/mockStudentGenerator.ts
export type Node = { id: string; label: string; x: number; y: number };
export type Edge = { source: string; target: string };

// Feature-to-node mapping with learning resources
const FEATURE_NODE_TEMPLATES = {
  payments: {
    node: { id: "payment", label: "PAYMENT SERVICE", x: 420, y: 260 },
    edges: [
      { source: "backend", target: "payment" },
      { source: "payment", target: "db" },
    ],
    explanation: "Payment Service: handles Stripe integration, webhooks, and payment flow.",
    tasks: [
      "Set up Stripe SDK and API keys",
      "Create payment intent endpoint",
      "Handle webhook for payment confirmation",
    ],
    resources: [
      { title: "Stripe Quickstart", url: "https://stripe.com/docs/payments/quickstart" },
      { title: "Webhook Security", url: "https://stripe.com/docs/webhooks/best-practices" },
    ],
  },
  notifications: {
    node: { id: "notify", label: "NOTIFICATION SERVICE", x: 520, y: 180 },
    edges: [
      { source: "backend", target: "notify" },
    ],
    explanation: "Notification Service: sends push notifications, emails, or SMS to users.",
    tasks: [
      "Choose notification provider (Firebase, SendGrid, Twilio)",
      "Set up API credentials",
      "Create send-notification endpoint",
    ],
    resources: [
      { title: "Firebase Cloud Messaging", url: "https://firebase.google.com/docs/cloud-messaging" },
      { title: "SendGrid Email API", url: "https://docs.sendgrid.com/for-developers/sending-email/api-getting-started" },
    ],
  },
  fileUpload: {
    node: { id: "storage", label: "FILE STORAGE", x: 580, y: 240 },
    edges: [
      { source: "backend", target: "storage" },
    ],
    explanation: "File Storage: manages user uploads (images, documents) using cloud storage.",
    tasks: [
      "Set up AWS S3 or Cloudinary account",
      "Create signed upload URLs",
      "Handle file metadata in database",
    ],
    resources: [
      { title: "AWS S3 Getting Started", url: "https://docs.aws.amazon.com/s3/index.html" },
      { title: "Cloudinary Upload", url: "https://cloudinary.com/documentation/upload_images" },
    ],
  },
};

export function generateStudentArchitecture(opts: {
  appType: string;
  skillLevel: "beginner"|"intermediate"|"advanced";
  constraints?: { budget?: "low"|"medium"|"high"; usersPerMin?: number };
  selectedFeatures?: string[];
  currentStep?: number;
}) {
  const { skillLevel, constraints, selectedFeatures = [], currentStep = 1 } = opts;
  // deterministic simple rules
  const base: { 
    nodes: Node[]; 
    edges: Edge[]; 
    explanations: string[];
    stepTitle?: string;
    implementationGuide?: {
      tasks: string[];
      resources: { title: string; url: string }[];
    };
  } = {
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

  // FEATURE-AWARE NODE INJECTION (for step 2+)
  // Step 1 is starter (handled in create route), step 2+ adds feature nodes
  if (currentStep > 1) {
    const featureNodes: Node[] = [];
    const featureEdges: Edge[] = [];
    const featureTasks: string[] = [];
    const featureResources: { title: string; url: string }[] = [];

    selectedFeatures.forEach((feature) => {
      const template = FEATURE_NODE_TEMPLATES[feature as keyof typeof FEATURE_NODE_TEMPLATES];
      if (template) {
        // adjust positions to avoid overlap (offset by feature index)
        const offset = featureNodes.length * 80;
        featureNodes.push({ 
          ...template.node, 
          x: template.node.x + offset, 
          y: template.node.y + offset 
        });
        featureEdges.push(...template.edges);
        base.explanations.push(template.explanation);
        featureTasks.push(...template.tasks);
        featureResources.push(...template.resources);
      }
    });

    if (featureNodes.length > 0) {
      base.nodes.push(...featureNodes);
      base.edges.push(...featureEdges);
      base.stepTitle = `Step ${currentStep}: Add ${selectedFeatures.map(f => f.charAt(0).toUpperCase() + f.slice(1)).join(", ")}`;
      base.implementationGuide = {
        tasks: featureTasks,
        resources: featureResources,
      };
    } else {
      base.stepTitle = `Step ${currentStep}: Expand Architecture`;
    }
  }

  // mock score (simple)
  const aiScore = skillLevel === "beginner" ? 75 : skillLevel === "intermediate" ? 82 : 88;

  return {
    nodes: base.nodes,
    edges: base.edges,
    explanations: base.explanations,
    stepTitle: base.stepTitle,
    implementationGuide: base.implementationGuide,
    metadata: { generator: "mock-v1", aiScore },
  };
}
