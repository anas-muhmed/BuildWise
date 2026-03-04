/**
 * PROPOSAL GENERATION API
 * 
 * Pipeline: Requirements → Context Builder → Prompt → OpenAI → Validate → Response
 * Safety: If AI fails at any step, falls back to mock proposals.
 * 
 * This is the core AI integration point for Pro Mode.
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { DraftProject } from "@/lib/backend/models/DraftProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { AI_CONFIG, validateAIConfig } from "@/lib/backend/ai/config";
import { callOpenAI } from "@/lib/backend/ai/openaiProvider";
import { buildGenerativeAIContext, renderGenerativeContextAsText } from "@/lib/backend/ai/context/generativeAIContextBuilder";

// ── Prompt for 3-option proposal generation ────────────────────────────────

const PROPOSAL_SYSTEM_PROMPT = `You are a senior software architect. Based on project requirements, you must propose exactly 3 architecture options with different trade-off profiles.

You MUST return a JSON object with this exact structure:

{
  "options": [
    {
      "id": "speed",
      "name": "string (creative name like 'The Speed Machine')",
      "tagline": "string (short catchy subtitle)",
      "layers": {
        "frontend": { "tech": "string", "reason": "string (why this fits)" },
        "backend": { "tech": "string", "reason": "string" },
        "database": { "tech": "string", "reason": "string" },
        "hosting": { "tech": "string", "reason": "string" },
        "extras": ["string (additional services like Stripe, Redis, etc)"]
      },
      "pros": ["string", "string", "string", "string"],
      "cons": ["string", "string", "string"],
      "monthlyCost": "string (e.g. '$25-$100')",
      "complexity": "Low | Medium | High",
      "timeToShip": "string (e.g. '2-4 weeks')",
      "bestFor": "string (who should use this)"
    }
  ]
}

RULES:
1. Option 1 (id: "speed"): Optimized for fastest development and lowest cost. Use managed services. Simple stack.
2. Option 2 (id: "balanced"): Production-ready, scalable. Standard industry stack. Good for growing teams.
3. Option 3 (id: "enterprise"): Enterprise-grade. Microservices if needed. Full observability. For large-scale apps.
4. Each option must use DIFFERENT technologies for at least 2 layers.
5. Costs must be realistic for the given budget and traffic level.
6. Pros/cons must be honest trade-offs, not marketing.
7. Extras should include relevant services based on required features (e.g. Stripe for payments, Socket.io for realtime).
8. Return ONLY valid JSON. No markdown, no explanations outside JSON.`;

// ── Mock fallback (matches AI output format) ───────────────────────────────

function getMockProposals(requirements: any) {
  const traffic = requirements?.traffic || "small";
  const budget = requirements?.budget || "low";
  const features = requirements?.must_have_features || [];
  const hasRealtime = features.some((f: string) => f.toLowerCase().includes("real-time") || f.toLowerCase().includes("chat"));
  const hasPayments = features.some((f: string) => f.toLowerCase().includes("payment"));

  return {
    options: [
      {
        id: "speed",
        name: "The Speed Machine",
        tagline: "Ship fast, iterate faster",
        layers: {
          frontend: { tech: "Next.js + Tailwind CSS", reason: "Full-stack framework with built-in API routes, SSR, and ISR. Ship fast." },
          backend: { tech: "Next.js API Routes + Prisma", reason: "Zero config backend. Prisma makes DB queries type-safe." },
          database: { tech: "PostgreSQL (Supabase)", reason: "Managed Postgres with built-in auth, realtime, and storage." },
          hosting: { tech: "Vercel", reason: "Zero-config deployment, edge functions, automatic HTTPS." },
          extras: [hasPayments ? "Stripe" : null, hasRealtime ? "Supabase Realtime" : null, "Resend for emails"].filter(Boolean)
        },
        pros: ["Fastest time to market", "Minimal infrastructure management", "Great developer experience", "Everything in one framework"],
        cons: ["Vendor lock-in to Vercel", "Limited server-side control", "Can get expensive at scale"],
        monthlyCost: budget === "low" ? "$0–$25" : "$25–$100",
        complexity: "Low",
        timeToShip: "2–4 weeks",
        bestFor: "MVPs, startups, solo developers"
      },
      {
        id: "balanced",
        name: "The Balanced Stack",
        tagline: "Production-ready from day one",
        layers: {
          frontend: { tech: "React + Vite + Tailwind", reason: "Lightweight SPA with fast builds and full control." },
          backend: { tech: "Node.js + Express + TypeScript", reason: "Battle-tested stack, mature ecosystem, easy to hire." },
          database: { tech: traffic === "large" ? "PostgreSQL + Redis" : "MongoDB Atlas + Redis", reason: traffic === "large" ? "Relational DB for complex queries + Redis caching." : "Flexible schema for rapid iteration + Redis sessions." },
          hosting: { tech: "AWS (ECS Fargate)", reason: "Scalable containers without managing servers." },
          extras: [hasPayments ? "Stripe" : null, hasRealtime ? "Socket.io" : null, "JWT auth", "Docker", "GitHub Actions CI/CD"].filter(Boolean)
        },
        pros: ["Production-grade from start", "Scales to 100K+ users", "No vendor lock-in", "Easy to hire developers"],
        cons: ["More initial setup time", "Need to manage infrastructure", "Higher learning curve"],
        monthlyCost: budget === "low" ? "$15–$50" : "$50–$200",
        complexity: "Medium",
        timeToShip: "4–8 weeks",
        bestFor: "Growing startups, professional projects"
      },
      {
        id: "enterprise",
        name: "The Enterprise Beast",
        tagline: "Built for millions of users",
        layers: {
          frontend: { tech: "Next.js + React Query + Zustand", reason: "SSR for SEO, React Query for server state, Zustand for client." },
          backend: { tech: "Microservices (Node.js + Go)", reason: "Service isolation. Node for API gateway, Go for high-throughput." },
          database: { tech: "PostgreSQL + MongoDB + Redis + ElasticSearch", reason: "Polyglot persistence — right DB for each job." },
          hosting: { tech: "Kubernetes (AWS EKS)", reason: "Full orchestration, auto-scaling, self-healing containers." },
          extras: [hasPayments ? "Stripe + fraud detection" : null, hasRealtime ? "Kafka + WebSocket gateway" : null, "OAuth 2.0 + RBAC", "Prometheus + Grafana", "Terraform IaC"].filter(Boolean)
        },
        pros: ["Handles millions of concurrent users", "Independent service scaling", "Full observability", "Enterprise-grade security"],
        cons: ["Complex infrastructure", "Requires DevOps expertise", "High monthly costs", "Over-engineered for small apps"],
        monthlyCost: "$200–$2000+",
        complexity: "High",
        timeToShip: "3–6 months",
        bestFor: "Enterprise apps, high-traffic platforms"
      }
    ]
  };
}

// ── API Route ──────────────────────────────────────────────────────────────

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
    let proposals;
    let source: "ai" | "mock" = "mock";

    // ── Try real AI ──
    if (AI_CONFIG.USE_REAL_AI) {
      const configCheck = validateAIConfig();
      
      if (configCheck.valid) {
        try {
          // Build context from requirements
          const context = buildGenerativeAIContext({
            description: project.starter_prompt || project.title || "web application",
            requirements: {
              users: requirements.users,
              traffic: requirements.traffic,
              budget: requirements.budget,
              must_have_features: requirements.must_have_features,
              priorities: requirements.priorities,
            },
          });

          const contextText = renderGenerativeContextAsText(context);

          // Call OpenAI
          const result = await callOpenAI(PROPOSAL_SYSTEM_PROMPT, contextText);
          
          // Parse JSON
          const parsed = JSON.parse(result.content);

          // Basic validation: must have options array with 3 items
          if (parsed.options && Array.isArray(parsed.options) && parsed.options.length >= 3) {
            proposals = parsed;
            source = "ai";
            console.log(`[AI] Generated proposals for ${projectId} (${result.tokens} tokens)`);
          } else {
            console.warn("[AI] Invalid structure, falling back to mock");
          }
        } catch (aiError) {
          console.error("[AI] Failed, falling back to mock:", aiError);
          // Fall through to mock
        }
      } else {
        console.warn("[AI] Config invalid:", configCheck.errors);
      }
    }

    // ── Fallback to mock ──
    if (!proposals) {
      proposals = getMockProposals(requirements);
      console.log(`[Mock] Using mock proposals for ${projectId}`);
    }

    // Update project phase
    project.current_phase = 2;
    project.updated_at = new Date();
    await project.save();

    return NextResponse.json({
      ok: true,
      source,
      ...proposals,
    });
  } catch (error) {
    console.error("[generate-proposal]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
