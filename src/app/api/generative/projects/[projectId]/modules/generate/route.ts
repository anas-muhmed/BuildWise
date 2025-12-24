// app/api/generative/projects/[id]/modules/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { DraftProject, Proposal } from "@/lib/backend/models/DraftProject";
import { Module } from "@/lib/backend/models/Module";
import { AuditLog } from "@/lib/backend/models/DraftProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

/**
 * 🎯 Phase 2 → Phase 3 Bridge
 * Generate initial modules from Phase 2 proposal
 * Master's ideology: One feature = one module (breakdown for teaching)
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const resolvedParams = await params;
    const project = await DraftProject.findOne({
      _id: resolvedParams.id,
      owner_id: user.id
    });

    if (!project || !project.proposal_id) {
      return NextResponse.json(
        { error: "Proposal not found. Complete Phase 2 first." },
        { status: 404 }
      );
    }

    // Check if modules already exist
    const existingModules = await Module.find({ project_id: resolvedParams.id });
    if (existingModules.length > 0) {
      return NextResponse.json({
        ok: true,
        message: "Modules already generated",
        modules: existingModules
      });
    }

    const proposal = await Proposal.findById(project.proposal_id).lean();
    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Generate modules from proposal components
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modules = await generateModulesFromProposal(
      resolvedParams.id,
      proposal as any,
      project.requirements!,
      user.id
    );

    // Update project phase
    project.current_phase = 3;
    project.updated_at = new Date();
    await project.save();

    // Audit log
    await AuditLog.create({
      project_id: resolvedParams.id,
      action: "modules_generated",
      by: user.id,
      metadata: { module_count: modules.length },
      timestamp: new Date()
    });

    return NextResponse.json({
      ok: true,
      modules,
      message: `Generated ${modules.length} modules from proposal`
    });
  } catch (error) {
    console.error("[modules/generate POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Convert proposal components into architecture modules
 * Master's approach: Break down by feature domain, not by tech layer
 */
async function generateModulesFromProposal(
  projectId: string,
  proposal: { components: Array<{ component: string; choice: string }> },
  requirements: { must_have_features: string[]; traffic?: string; team_size?: number },
  userId: string
) {
  const modules = [];
  let order = 1;

  // Get must-have features from requirements
  const features = requirements.must_have_features || [];

  // MODULE 1: Core Authentication & User Management (if auth exists)
  const hasAuth = proposal.components.some((c) =>
    c.component.toLowerCase().includes("auth")
  );
  if (hasAuth) {
    modules.push(
      await Module.create({
        project_id: projectId,
        name: "Authentication & User Management",
        description: "User signup, login, session management, and profile handling",
        order: order++,
        status: "proposed",
        created_by: userId,
        nodes: [
          {
            id: "mobile_app",
            type: "client",
            label: "Mobile/Web Client",
            meta: { platform: "cross-platform" }
          },
          {
            id: "api_gateway",
            type: "gateway",
            label: "API Gateway",
            meta: { type: "Kong" }
          },
          {
            id: "auth_service",
            type: "auth",
            label: "Auth Service",
            meta: { strategy: "JWT" }
          },
          {
            id: "user_database",
            type: "database",
            label: "User Database",
            meta: { engine: "mongodb", collections: ["users", "sessions"] }
          }
        ],
        edges: [
          { from: "mobile_app", to: "api_gateway", label: "HTTPS" },
          { from: "api_gateway", to: "auth_service", label: "Auth endpoints" },
          { from: "auth_service", to: "user_database", label: "User CRUD" }
        ],
        rationale:
          "Authentication is the foundation. All other modules depend on user identity verification.",
        ai_feedback: {
          confidence: "high",
          alternatives: ["Firebase Auth", "Auth0 integration"],
          resources: ["https://jwt.io/introduction"]
        }
      })
    );
  }

  // MODULE 2: Create one module per must-have feature
  for (let i = 0; i < Math.min(features.length, 5); i++) {
    const feature = features[i];
    const featureLower = feature.toLowerCase();

    // Determine service type and nodes based on feature
    let nodes = [];
    let edges = [];

    if (featureLower.includes("payment")) {
      nodes = [
        { id: "api_gateway", type: "gateway", label: "API Gateway" },
        {
          id: "payment_service",
          type: "service",
          label: "Payment Service",
          meta: { provider: "Stripe" }
        },
        {
          id: "order_database",
          type: "database",
          label: "Orders DB",
          meta: { engine: "mongodb" }
        },
        {
          id: "payment_queue",
          type: "queue",
          label: "Payment Queue",
          meta: { type: "Redis" }
        }
      ];
      edges = [
        { from: "api_gateway", to: "payment_service", label: "Payment API" },
        { from: "payment_service", to: "order_database", label: "Store orders" },
        { from: "payment_service", to: "payment_queue", label: "Async processing" }
      ];
    } else if (featureLower.includes("notif")) {
      nodes = [
        {
          id: "notification_service",
          type: "service",
          label: "Notification Service",
          meta: { type: "FCM" }
        },
        { id: "mobile_app", type: "client", label: "Mobile Client" },
        {
          id: "notification_queue",
          type: "queue",
          label: "Notification Queue",
          meta: { type: "Redis" }
        }
      ];
      edges = [
        {
          from: "notification_queue",
          to: "notification_service",
          label: "Dequeue"
        },
        { from: "notification_service", to: "mobile_app", label: "Push" }
      ];
    } else if (featureLower.includes("real-time") || featureLower.includes("chat")) {
      nodes = [
        { id: "mobile_app", type: "client", label: "Mobile Client" },
        {
          id: "websocket_server",
          type: "realtime",
          label: "WebSocket Server",
          meta: { library: "Socket.io" }
        },
        {
          id: "message_database",
          type: "database",
          label: "Message Store",
          meta: { engine: "mongodb" }
        },
        { id: "redis_cache", type: "cache", label: "Redis Cache" }
      ];
      edges = [
        { from: "mobile_app", to: "websocket_server", label: "WebSocket" },
        { from: "websocket_server", to: "redis_cache", label: "Presence" },
        { from: "websocket_server", to: "message_database", label: "Persist" }
      ];
    } else if (featureLower.includes("search")) {
      nodes = [
        { id: "api_gateway", type: "gateway", label: "API Gateway" },
        {
          id: "search_service",
          type: "search",
          label: "Search Service",
          meta: { engine: "Elasticsearch" }
        },
        {
          id: "content_database",
          type: "database",
          label: "Content DB",
          meta: { engine: "mongodb" }
        }
      ];
      edges = [
        { from: "api_gateway", to: "search_service", label: "Search API" },
        { from: "search_service", to: "content_database", label: "Index sync" }
      ];
    } else {
      // Generic feature module
      nodes = [
        { id: "api_gateway", type: "gateway", label: "API Gateway" },
        {
          id: `${feature.toLowerCase().replace(/\s+/g, "_")}_service`,
          type: "service",
          label: `${feature} Service`
        },
        {
          id: "database",
          type: "database",
          label: "Database",
          meta: { engine: "mongodb" }
        }
      ];
      edges = [
        {
          from: "api_gateway",
          to: `${feature.toLowerCase().replace(/\s+/g, "_")}_service`,
          label: "API"
        },
        {
          from: `${feature.toLowerCase().replace(/\s+/g, "_")}_service`,
          to: "database",
          label: "Data"
        }
      ];
    }

    modules.push(
      await Module.create({
        project_id: projectId,
        name: feature,
        description: `Implementation of ${feature} functionality`,
        order: order++,
        status: "proposed",
        created_by: userId,
        nodes,
        edges,
        rationale: `This module handles the core ${feature} functionality as specified in requirements.`,
        ai_feedback: {
          confidence: "medium",
          alternatives: [`Monolithic approach`, `Third-party service`],
          resources: []
        }
      })
    );
  }

  // MODULE LAST: Infrastructure & Monitoring
  if (requirements.traffic === "large" || (requirements.team_size && requirements.team_size >= 5)) {
    modules.push(
      await Module.create({
        project_id: projectId,
        name: "Infrastructure & Monitoring",
        description: "Logging, monitoring, CDN, and DevOps infrastructure",
        order: order++,
        status: "proposed",
        created_by: userId,
        nodes: [
          { id: "cdn", type: "cdn", label: "CDN", meta: { provider: "Cloudflare" } },
          {
            id: "monitoring",
            type: "monitoring",
            label: "Monitoring",
            meta: { tools: ["Datadog", "Sentry"] }
          },
          {
            id: "api_gateway",
            type: "gateway",
            label: "API Gateway",
            meta: { with_rate_limiting: true }
          }
        ],
        edges: [
          { from: "cdn", to: "api_gateway", label: "Cache & route" },
          { from: "api_gateway", to: "monitoring", label: "Metrics" }
        ],
        rationale:
          "Production-grade infrastructure with observability for large-scale deployment.",
        ai_feedback: {
          confidence: "medium",
          alternatives: ["AWS CloudWatch", "New Relic"],
          resources: ["https://www.datadoghq.com/"]
        }
      })
    );
  }

  return modules;
}
