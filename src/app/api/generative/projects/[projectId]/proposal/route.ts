// app/api/generative/projects/[id]/proposal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { DraftProject, Proposal, AuditLog } from "@/lib/backend/models/DraftProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { IRequirements, IStackChoice } from "@/lib/backend/models/DraftProject";

// 🎯 MASTER PLAN: Phase 2 API - Generate Stack Proposal based on requirements
// Returns proposal with components, choices, rationale, confidence

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const project = await DraftProject.findOne({
      _id: params.id,
      owner_id: user.id
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.requirements) {
      return NextResponse.json(
        { error: "Requirements not set. Complete Phase 1 first." },
        { status: 400 }
      );
    }

    // Generate stack choices based on requirements
    const components = generateStackChoices(project.requirements);

    // Create proposal
    const proposal = await Proposal.create({
      project_id: params.id,
      components,
      created_at: new Date(),
      ai_generated: true
    });

    // Update project
    project.proposal_id = proposal._id.toString();
    project.current_phase = 2;
    project.updated_at = new Date();
    await project.save();

    // Audit log
    await AuditLog.create({
      project_id: params.id,
      action: "proposal_generated",
      by: "AI",
      metadata: { proposal_id: proposal._id.toString() },
      timestamp: new Date()
    });

    return NextResponse.json({
      proposalId: proposal._id.toString(),
      components: proposal.components
    });
  } catch (error) {
    console.error("[proposal POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get existing proposal
export async function GET(
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
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const proposal = await Proposal.findById(project.proposal_id).lean();

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("[proposal GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// 🎯 CORE LOGIC: Generate Stack Choices from Requirements
function generateStackChoices(req: IRequirements): IStackChoice[] {
  const components: IStackChoice[] = [];

  // 1. FRONTEND
  const hasMobile = req.must_have_features.some(f => 
    f.toLowerCase().includes("mobile") || 
    req.app_type.toLowerCase().includes("app")
  );
  
  if (hasMobile || req.users.some(u => u.toLowerCase().includes("general"))) {
    components.push({
      component: "Frontend",
      choice: "React Native",
      rationale: `Cross-platform mobile development fits your ${req.team_size}-person team. Faster iteration than native iOS/Android, matches ${req.budget} budget.`,
      confidence: req.team_size <= 3 ? "high" : "medium",
      alternatives: ["Flutter", "Native iOS/Android"],
      learning_resources: [
        { title: "React Native Docs", url: "https://reactnative.dev/docs/getting-started" },
        { title: "Expo Guide", url: "https://docs.expo.dev/" }
      ]
    });
  } else {
    components.push({
      component: "Frontend",
      choice: "Next.js (React)",
      rationale: `Modern web framework with SSR/SSG for better performance. Great for ${req.users.join(", ")} audience. SEO-friendly.`,
      confidence: "high",
      alternatives: ["Vue.js", "Angular"],
      learning_resources: [
        { title: "Next.js Tutorial", url: "https://nextjs.org/learn" },
        { title: "React Docs", url: "https://react.dev/" }
      ]
    });
  }

  // 2. BACKEND
  const needsRealtime = req.must_have_features.some(f => 
    f.toLowerCase().includes("real-time") || 
    f.toLowerCase().includes("chat")
  );
  
  if (needsRealtime) {
    components.push({
      component: "Backend",
      choice: "Node.js + Socket.io",
      rationale: `Real-time features (${req.must_have_features.filter(f => f.toLowerCase().includes("real-time") || f.toLowerCase().includes("chat")).join(", ")}) require WebSocket support. Node.js excels at concurrent connections.`,
      confidence: "high",
      alternatives: ["Go with Gorilla WebSocket", "Python with Django Channels"],
      learning_resources: [
        { title: "Socket.io Docs", url: "https://socket.io/docs/" },
        { title: "Node.js Best Practices", url: "https://github.com/goldbergyoni/nodebestpractices" }
      ]
    });
  } else if (req.traffic === "large" || req.priorities.includes("Speed/Performance")) {
    components.push({
      component: "Backend",
      choice: "Go (Golang)",
      rationale: `${req.traffic} traffic and ${req.priorities.join("+")} priorities. Go offers high concurrency and low latency.`,
      confidence: "medium",
      alternatives: ["Node.js", "Rust"],
      learning_resources: [
        { title: "Go by Example", url: "https://gobyexample.com/" },
        { title: "Effective Go", url: "https://go.dev/doc/effective_go" }
      ]
    });
  } else {
    components.push({
      component: "Backend",
      choice: "Node.js + Express",
      rationale: `Fast development, shared JavaScript with frontend. Perfect for ${req.team_size}-person team and ${req.budget} budget.`,
      confidence: "high",
      alternatives: ["Python + FastAPI", "Ruby on Rails"],
      learning_resources: [
        { title: "Express.js Guide", url: "https://expressjs.com/en/guide/routing.html" },
        { title: "RESTful API Design", url: "https://restfulapi.net/" }
      ]
    });
  }

  // 3. DATABASE
  const needsFlexibleSchema = req.app_type.toLowerCase().includes("social") ||
                              req.must_have_features.some(f => f.toLowerCase().includes("analytics"));
  
  if (needsFlexibleSchema || req.budget === "low") {
    components.push({
      component: "Database",
      choice: "MongoDB",
      rationale: `Flexible schema fits evolving ${req.app_type}. Free tier available (${req.budget} budget). JSON-like documents match Node.js naturally.`,
      confidence: "high",
      alternatives: ["PostgreSQL", "DynamoDB"],
      learning_resources: [
        { title: "MongoDB University", url: "https://university.mongodb.com/" },
        { title: "Mongoose Guide", url: "https://mongoosejs.com/docs/guide.html" }
      ]
    });
  } else {
    components.push({
      component: "Database",
      choice: "PostgreSQL",
      rationale: `ACID compliance for ${req.must_have_features.filter(f => f.toLowerCase().includes("payment") || f.toLowerCase().includes("transaction")).join(", ") || "critical data"}. Mature, reliable, scales to ${req.traffic} traffic.`,
      confidence: "high",
      alternatives: ["MySQL", "MongoDB"],
      learning_resources: [
        { title: "PostgreSQL Tutorial", url: "https://www.postgresqltutorial.com/" },
        { title: "SQL Best Practices", url: "https://www.sqlstyle.guide/" }
      ]
    });
  }

  // 4. AUTHENTICATION
  if (req.must_have_features.some(f => f.toLowerCase().includes("auth"))) {
    components.push({
      component: "Authentication",
      choice: "JWT + OAuth2",
      rationale: `Stateless auth scales well. OAuth2 for social logins (${req.users.join(", ")}). JWTs work across mobile and web.`,
      confidence: "high",
      alternatives: ["Firebase Auth", "Auth0"],
      learning_resources: [
        { title: "JWT.io Introduction", url: "https://jwt.io/introduction" },
        { title: "OAuth 2.0 Simplified", url: "https://aaronparecki.com/oauth-2-simplified/" }
      ]
    });
  }

  // 5. PAYMENTS
  if (req.must_have_features.some(f => f.toLowerCase().includes("payment"))) {
    components.push({
      component: "Payment Gateway",
      choice: "Stripe",
      rationale: `Industry standard. Developer-friendly API. Handles ${req.budget === "low" ? "no upfront costs" : "complex payment flows"}. Strong fraud protection.`,
      confidence: "high",
      alternatives: ["PayPal", "Razorpay (India)"],
      learning_resources: [
        { title: "Stripe Integration Guide", url: "https://stripe.com/docs" },
        { title: "Payment Security Best Practices", url: "https://stripe.com/docs/security" }
      ]
    });
  }

  // 6. NOTIFICATIONS
  if (req.must_have_features.some(f => f.toLowerCase().includes("notif"))) {
    components.push({
      component: "Notifications",
      choice: "Firebase Cloud Messaging (FCM)",
      rationale: `Free push notifications for mobile. Cross-platform (iOS/Android). Scales automatically.`,
      confidence: "high",
      alternatives: ["OneSignal", "AWS SNS"],
      learning_resources: [
        { title: "FCM Documentation", url: "https://firebase.google.com/docs/cloud-messaging" },
        { title: "Push Notification Best Practices", url: "https://onesignal.com/blog/push-notification-guide/" }
      ]
    });
  }

  // 7. FILE STORAGE
  if (req.must_have_features.some(f => f.toLowerCase().includes("file") || f.toLowerCase().includes("upload"))) {
    components.push({
      component: "File Storage",
      choice: req.budget === "low" ? "AWS S3" : "Cloudinary",
      rationale: req.budget === "low" 
        ? "S3 is cost-effective for large storage. Pay-per-use model fits startup budget."
        : "Cloudinary offers image transformations and CDN out of the box. Faster development.",
      confidence: "medium",
      alternatives: ["Google Cloud Storage", "Azure Blob Storage"],
      learning_resources: [
        { title: "AWS S3 Guide", url: "https://docs.aws.amazon.com/s3/" },
        { title: "Cloudinary Docs", url: "https://cloudinary.com/documentation" }
      ]
    });
  }

  // 8. CACHING (if large traffic or performance priority)
  if (req.traffic === "large" || req.priorities.includes("Speed/Performance")) {
    components.push({
      component: "Cache",
      choice: "Redis",
      rationale: `${req.traffic} traffic needs caching. Redis is fast, versatile (sessions, cache, queues). Reduces DB load by 60-80%.`,
      confidence: "high",
      alternatives: ["Memcached", "Varnish"],
      learning_resources: [
        { title: "Redis University", url: "https://university.redis.com/" },
        { title: "Caching Strategies", url: "https://redis.io/docs/manual/patterns/" }
      ]
    });
  }

  // 9. SEARCH (if search feature requested)
  if (req.must_have_features.some(f => f.toLowerCase().includes("search"))) {
    components.push({
      component: "Search Engine",
      choice: req.budget === "high" ? "Elasticsearch" : "Algolia",
      rationale: req.budget === "high"
        ? "Elasticsearch offers full control and advanced queries. Self-hosted for cost control at scale."
        : "Algolia is managed, fast setup. Pay-as-you-grow pricing fits small-medium projects.",
      confidence: "medium",
      alternatives: ["Meilisearch", "Typesense"],
      learning_resources: [
        { title: "Elasticsearch Guide", url: "https://www.elastic.co/guide/" },
        { title: "Algolia Docs", url: "https://www.algolia.com/doc/" }
      ]
    });
  }

  // 10. API GATEWAY (if large team or microservices needed)
  if (req.team_size >= 5 || req.traffic === "large") {
    components.push({
      component: "API Gateway",
      choice: "Kong",
      rationale: `${req.team_size}-person team benefits from centralized routing, rate limiting, and auth. Kong scales to ${req.traffic} traffic.`,
      confidence: "medium",
      alternatives: ["AWS API Gateway", "Nginx"],
      learning_resources: [
        { title: "Kong Getting Started", url: "https://docs.konghq.com/gateway/latest/get-started/" },
        { title: "API Gateway Patterns", url: "https://microservices.io/patterns/apigateway.html" }
      ]
    });
  }

  return components;
}
