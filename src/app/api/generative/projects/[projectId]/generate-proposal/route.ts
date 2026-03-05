// app/api/generative/projects/[projectId]/generate-proposal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { DraftProject } from "@/lib/backend/models/DraftProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { callOpenAI } from "@/lib/backend/ai/openaiProvider";
import { AI_CONFIG } from "@/lib/backend/ai/config";
import { buildGenerativeAIContext } from "@/lib/backend/ai/context/generativeAIContextBuilder";

// ── Types ──────────────────────────────────────────────────────────────────

interface ArchModule {
  name: string;
  responsibility: string;
  tech: string;
  depends_on: string[];
}

interface ArchDecision {
  category: string;
  choice: string;
  reasoning: string;
  alternatives: string[];
  confidence: "high" | "medium" | "low";
}

interface ArchProposal {
  id: string;
  approach: string;
  name: string;
  tagline: string;
  modules: ArchModule[];
  decisions: ArchDecision[];
  assumptions: string[];
  pros: string[];
  cons: string[];
  estimatedCost: string;
  complexity: "Low" | "Medium" | "High";
  timeToShip: string;
}

// ── System Prompt ──────────────────────────────────────────────────────────

const ARCHITECTURE_SYSTEM_PROMPT = `You are a senior software architect. You design production-ready system architectures.

TASK: Generate exactly 3 architecturally DIFFERENT proposals for the given project.

Each proposal must use a DIFFERENT architectural approach:
1. "monolith" — single deployable unit, simple, fast to build
2. "service-oriented" — modular backend with independently deployable services
3. "event-driven" — serverless/cloud-native with message queues and auto-scaling

For each proposal, provide:
- A creative name and tagline
- System modules (4-8 modules) with name, responsibility, technology choice, and dependencies
- Key architectural decisions with reasoning and alternatives considered
- Assumptions about scope
- Pros and cons of this approach
- Estimated monthly cost range, complexity level, and time to ship

OUTPUT FORMAT — Return ONLY this JSON:
{
  "proposals": [
    {
      "id": "monolith",
      "approach": "Monolith",
      "name": "string — creative name like 'The Rapid Builder'",
      "tagline": "string — one-line description",
      "modules": [
        {
          "name": "string — e.g. 'User Service'",
          "responsibility": "string — what this module does",
          "tech": "string — technology used",
          "depends_on": ["string — names of other modules"]
        }
      ],
      "decisions": [
        {
          "category": "frontend | backend | database | auth | payments | realtime | cache | deployment",
          "choice": "string",
          "reasoning": "string — WHY this choice for THIS approach",
          "alternatives": ["string"],
          "confidence": "high | medium | low"
        }
      ],
      "assumptions": ["string"],
      "pros": ["string — 3-4 advantages"],
      "cons": ["string — 2-3 trade-offs"],
      "estimatedCost": "string — e.g. '$0-25/mo'",
      "complexity": "Low | Medium | High",
      "timeToShip": "string — e.g. '2-4 weeks'"
    }
  ]
}

CRITICAL RULES:
1. Each proposal MUST have a different architectural approach
2. Modules must reference real technologies, not generic placeholders
3. Every decision must say WHY, not just WHAT
4. depends_on values must exactly match module names within the same proposal
5. Return ONLY valid JSON, no markdown, no code fences, no explanations
6. Module count: 4-8 per proposal
7. Decision count: 4-8 per proposal`;

// ── Mock Proposals (fallback) ──────────────────────────────────────────────

function getMockProposals(requirements: any): ArchProposal[] {
  const integrations = requirements?.integrations || requirements?.must_have_features || [];
  const hasAuth = integrations.some((f: string) => f.toLowerCase().includes("auth"));
  const hasPayments = integrations.some((f: string) => f.toLowerCase().includes("payment"));
  const hasRealtime = integrations.some((f: string) => f.toLowerCase().includes("realtime") || f.toLowerCase().includes("real-time") || f.toLowerCase().includes("websocket"));

  return [
    {
      id: "monolith",
      approach: "Monolith",
      name: "The Rapid Builder",
      tagline: "Ship fast with a single deployable unit",
      modules: [
        { name: "Web Application", responsibility: "Serves UI and handles all HTTP routes in a single Next.js app", tech: "Next.js 14 + TypeScript", depends_on: [] },
        { name: "API Layer", responsibility: "RESTful endpoints via Next.js API routes, handles all business logic", tech: "Next.js API Routes", depends_on: ["Web Application"] },
        { name: "Database", responsibility: "Single database storing all application data with flexible schema", tech: "MongoDB Atlas", depends_on: [] },
        ...(hasAuth ? [{ name: "Auth Module", responsibility: "User registration, login, session management with JWT", tech: "NextAuth.js + JWT", depends_on: ["Database"] }] : []),
        ...(hasPayments ? [{ name: "Payment Module", responsibility: "Handles checkout, subscriptions, and payment processing", tech: "Stripe SDK", depends_on: ["API Layer", "Database"] }] : []),
        ...(hasRealtime ? [{ name: "Realtime Module", responsibility: "WebSocket connections for live updates and notifications", tech: "Socket.io", depends_on: ["API Layer"] }] : []),
      ],
      decisions: [
        { category: "frontend", choice: "Next.js 14 + Tailwind CSS", reasoning: "Full-stack framework eliminates the need for a separate backend. SSR gives SEO benefits. Tailwind accelerates UI development.", alternatives: ["React + Vite", "Vue + Nuxt"], confidence: "high" as const },
        { category: "backend", choice: "Next.js API Routes", reasoning: "Co-located with frontend, zero deployment complexity. Perfect for monolith approach where all code lives together.", alternatives: ["Express.js", "FastAPI"], confidence: "high" as const },
        { category: "database", choice: "MongoDB Atlas", reasoning: "Flexible schema handles rapid iteration. Managed service eliminates DevOps overhead. Free tier for MVPs.", alternatives: ["PostgreSQL", "Supabase"], confidence: "medium" as const },
        { category: "deployment", choice: "Vercel", reasoning: "Zero-config deployment for Next.js. Auto HTTPS, CDN, and preview deployments. Generous free tier.", alternatives: ["Railway", "Render"], confidence: "high" as const },
      ],
      assumptions: ["Team size is 1-3 developers", "No need for independent service scaling initially", "Traffic will grow gradually"],
      pros: ["Fastest time to market", "Single codebase to maintain", "Zero DevOps overhead", "Low initial cost"],
      cons: ["Harder to scale individual components", "All-or-nothing deployments", "Can become monolithic spaghetti over time"],
      estimatedCost: "$0–25/mo",
      complexity: "Low",
      timeToShip: "2–4 weeks",
    },
    {
      id: "service-oriented",
      approach: "Service-Oriented",
      name: "The Balanced Engine",
      tagline: "Modular services that scale independently",
      modules: [
        { name: "Frontend App", responsibility: "React SPA with client-side routing and state management", tech: "React + Vite + Zustand", depends_on: ["API Gateway"] },
        { name: "API Gateway", responsibility: "Central entry point routing requests to appropriate backend services", tech: "Node.js + Express", depends_on: [] },
        { name: "User Service", responsibility: "User management, authentication, profile operations", tech: "Node.js + Express + JWT", depends_on: ["User Database"] },
        { name: "User Database", responsibility: "Stores user data, credentials, and sessions", tech: "PostgreSQL", depends_on: [] },
        { name: "Core Service", responsibility: "Main business logic — orders, listings, content management", tech: "Node.js + Express", depends_on: ["Core Database"] },
        { name: "Core Database", responsibility: "Stores application data — products, orders, content", tech: "MongoDB", depends_on: [] },
        ...(hasPayments ? [{ name: "Payment Service", responsibility: "Isolated payment processing with PCI compliance considerations", tech: "Node.js + Stripe", depends_on: ["Core Service"] }] : []),
        ...(hasRealtime ? [{ name: "Realtime Service", responsibility: "WebSocket server for live updates, chat, and notifications", tech: "Node.js + Socket.io + Redis Pub/Sub", depends_on: ["API Gateway"] }] : []),
      ],
      decisions: [
        { category: "frontend", choice: "React + Vite + Zustand", reasoning: "Decoupled from backend. Vite gives fast dev experience. Zustand for lightweight state without Redux boilerplate.", alternatives: ["Next.js", "Angular"], confidence: "high" as const },
        { category: "backend", choice: "Node.js + Express microservices", reasoning: "Each service owns its domain. Independent deployment and scaling. Express is battle-tested for service architectures.", alternatives: ["FastAPI (Python)", "Go + Gin"], confidence: "high" as const },
        { category: "database", choice: "PostgreSQL + MongoDB (polyglot)", reasoning: "PostgreSQL for relational user data (ACID). MongoDB for flexible content data. Right database for each job.", alternatives: ["Single PostgreSQL", "DynamoDB"], confidence: "medium" as const },
        { category: "deployment", choice: "Docker + Railway", reasoning: "Containers ensure consistency. Railway simplifies multi-service deployment without Kubernetes complexity.", alternatives: ["AWS ECS", "DigitalOcean"], confidence: "medium" as const },
      ],
      assumptions: ["Team of 3-5 developers", "Services communicate via REST initially", "Each service has its own database"],
      pros: ["Independent service scaling", "Team can work on services in parallel", "Right technology for each component", "Clean separation of concerns"],
      cons: ["More complex deployment", "Network latency between services", "Requires service discovery and monitoring"],
      estimatedCost: "$25–100/mo",
      complexity: "Medium",
      timeToShip: "4–8 weeks",
    },
    {
      id: "event-driven",
      approach: "Event-Driven",
      name: "The Cloud Native",
      tagline: "Serverless and auto-scaling from day one",
      modules: [
        { name: "Frontend CDN", responsibility: "Static SPA served globally via CDN with edge caching", tech: "Next.js (Static Export) + CloudFront", depends_on: [] },
        { name: "API Functions", responsibility: "Serverless functions handling all API requests, auto-scaling to zero", tech: "AWS Lambda + API Gateway", depends_on: ["Event Bus"] },
        { name: "Event Bus", responsibility: "Asynchronous message broker connecting all services via events", tech: "Amazon EventBridge", depends_on: [] },
        { name: "User Store", responsibility: "User identity, auth, and profile data with managed auth", tech: "AWS Cognito + DynamoDB", depends_on: [] },
        { name: "Data Store", responsibility: "Core application data with auto-scaling and global replication", tech: "DynamoDB", depends_on: [] },
        { name: "Worker Functions", responsibility: "Background processors for emails, notifications, data transforms", tech: "AWS Lambda (triggered by events)", depends_on: ["Event Bus", "Data Store"] },
        ...(hasPayments ? [{ name: "Payment Processor", responsibility: "Event-driven payment flow with webhook handling", tech: "Lambda + Stripe Webhooks", depends_on: ["Event Bus", "Data Store"] }] : []),
        ...(hasRealtime ? [{ name: "Realtime Gateway", responsibility: "Managed WebSocket connections for live updates", tech: "AWS AppSync / API Gateway WebSocket", depends_on: ["Event Bus"] }] : []),
      ],
      decisions: [
        { category: "frontend", choice: "Next.js Static Export + CloudFront", reasoning: "Pre-rendered pages served from CDN edge. Near-zero server cost. Global performance.", alternatives: ["Vercel", "Netlify"], confidence: "high" as const },
        { category: "backend", choice: "AWS Lambda (Serverless)", reasoning: "Pay-per-invocation model. Auto-scales to zero when idle, to millions when needed. No servers to manage.", alternatives: ["Cloud Functions", "Cloudflare Workers"], confidence: "high" as const },
        { category: "database", choice: "DynamoDB", reasoning: "Serverless database that matches the serverless compute model. Single-digit millisecond latency at any scale.", alternatives: ["Aurora Serverless", "PlanetScale"], confidence: "medium" as const },
        { category: "deployment", choice: "AWS CDK (Infrastructure as Code)", reasoning: "Entire architecture defined in code. Reproducible, version-controlled infrastructure.", alternatives: ["Terraform", "Serverless Framework"], confidence: "medium" as const },
      ],
      assumptions: ["Team comfortable with AWS ecosystem", "Traffic is unpredictable/bursty", "Cost optimization is important at rest"],
      pros: ["Scales to millions automatically", "Pay only for what you use", "Zero server management", "Built-in fault tolerance"],
      cons: ["Cold start latency", "Vendor lock-in to AWS", "Complex debugging and monitoring", "Steep learning curve"],
      estimatedCost: "$5–200/mo (usage-based)",
      complexity: "High",
      timeToShip: "6–10 weeks",
    },
  ];
}

// ── POST Handler ───────────────────────────────────────────────────────────

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const user = await getAuthUser(req);

    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const project = await DraftProject.findOne({
      _id: projectId,
      owner_id: user.id,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const requirements = project.requirements || {};
    let proposals: ArchProposal[];
    let source: "ai" | "mock" = "mock";

    // Try real AI if enabled
    if (AI_CONFIG.USE_REAL_AI && AI_CONFIG.OPENAI_API_KEY) {
      try {
        console.log("[generate-proposal] Using real AI (GPT-4.1)");

        // Build context from requirements
        const context = buildGenerativeAIContext({
          description: project.starter_prompt || project.title,
          requirements: {
            users: requirements.users,
            traffic: requirements.traffic,
            budget: requirements.budget,
            team_size: requirements.team_size,
            must_have_features: requirements.must_have_features,
            priorities: requirements.priorities,
          },
        });

        // Build the user message with full context
        const userMessage = `PROJECT CONTEXT:
${context.systemBrief}

CONSTRAINTS:
${context.constraints.map((c: string) => `- ${c}`).join("\n")}

PRIORITIES:
${context.priorities.map((p: string) => `- ${p}`).join("\n")}

Required integrations: ${(requirements.integrations || requirements.must_have_features || []).join(", ")}
Scale: ${requirements.scale || requirements.traffic || "medium"}
Top priority: ${requirements.priority || "balanced"}

Generate 3 architecturally different proposals now.`;

        const aiResult = await callOpenAI(
          ARCHITECTURE_SYSTEM_PROMPT,
          userMessage
        );

        // Parse and validate
        const parsed = JSON.parse(aiResult.content);
        if (parsed.proposals && Array.isArray(parsed.proposals) && parsed.proposals.length >= 3) {
          // Ensure each proposal has required fields
          proposals = parsed.proposals.slice(0, 3).map((p: any, idx: number) => ({
            id: p.id || ["monolith", "service-oriented", "event-driven"][idx],
            approach: p.approach || ["Monolith", "Service-Oriented", "Event-Driven"][idx],
            name: p.name || `Proposal ${idx + 1}`,
            tagline: p.tagline || "",
            modules: (p.modules || []).map((m: any) => ({
              name: m.name || "Unknown Module",
              responsibility: m.responsibility || "",
              tech: m.tech || "",
              depends_on: m.depends_on || [],
            })),
            decisions: (p.decisions || []).map((d: any) => ({
              category: d.category || "other",
              choice: d.choice || "",
              reasoning: d.reasoning || "",
              alternatives: d.alternatives || [],
              confidence: d.confidence || "medium",
            })),
            assumptions: p.assumptions || [],
            pros: p.pros || [],
            cons: p.cons || [],
            estimatedCost: p.estimatedCost || p.estimated_cost || "$?",
            complexity: p.complexity || "Medium",
            timeToShip: p.timeToShip || p.time_to_ship || "?",
          }));
          source = "ai";
          console.log("[generate-proposal] AI generated successfully");
        } else {
          throw new Error("AI response missing proposals array");
        }
      } catch (aiError) {
        console.error("[generate-proposal] AI failed, falling back to mock:", aiError);
        proposals = getMockProposals(requirements);
        source = "mock";
      }
    } else {
      console.log("[generate-proposal] Using mock data (USE_REAL_AI is false)");
      proposals = getMockProposals(requirements);
    }

    // Update project phase
    await DraftProject.updateOne(
      { _id: projectId },
      { $set: { current_phase: 2, updated_at: new Date() } }
    );

    return NextResponse.json({
      proposals,
      source,
      projectId,
    });

  } catch (error) {
    console.error("[generate-proposal] Fatal error:", error);
    return NextResponse.json(
      { error: "Failed to generate proposals" },
      { status: 500 }
    );
  }
}
