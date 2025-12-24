import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { requireRoleOrThrow } from "@/lib/backend/auth";
// Import Node type from ArchitectureCanvas
import { Node } from "@/components/generative-ai/ArchitectureCanvas";
import { saveProject } from "@/lib/backend/projects";
import { enqueueSnapshotJob } from "@/lib/backend/jobs";

// Move ExtendedNode and ExtendedEdge definitions to the top level
export interface ExtendedNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: string;
}

// Ensure ExtendedEdge includes the optional `label` property
export interface ExtendedEdge {
  from: string;
  to: string;
  label?: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);
    
    if (!user || !user.userId) {
      return NextResponse.json(
        { error: "Invalid user authentication" },
        { status: 401 }
      );
    }
    
    await connectDB();

    const body = await req.json();
    const { appType, skillLevel, selectedFeatures } = body;
    
    console.log('[api] CREATE received body.members:', body.members);
    console.log('[api] CREATE members count:', (body.members || []).length);

    if (!appType || !skillLevel) {
      return NextResponse.json(
        { error: "Missing required fields: appType and skillLevel are required" },
        { status: 400 }
      );
    }

    const features = selectedFeatures || [];

    // =============== Feature-Aware Starter Step (Meaningful Canvas) ===============
    function buildStarterStep(appType: string, skillLevel: string, features: string[]) {
      const nodes: ExtendedNode[] = [
        { id: "n-frontend", type: "frontend", label: "FRONTEND\n(web/mobile)", x: 120, y: 220 },
        { id: "n-backend", type: "backend", label: "BACKEND\n(API)", x: 420, y: 220 },
      ];

      let xOffset = 720;

      // Feature-aware nodes
      if (features.includes("payments")) {
        nodes.push({ 
          id: "n-payment", 
          type: "service", 
          label: "PAYMENT\nSERVICE", 
          x: xOffset, 
          y: 220 
        });
        xOffset += 280;
      }

      if (features.includes("notifications")) {
        nodes.push({ 
          id: "n-notify", 
          type: "service", 
          label: "NOTIFICATION\nSERVICE", 
          x: xOffset, 
          y: 220 
        });
        xOffset += 280;
      }

      // Add database after services
      nodes.push({ 
        id: "n-database", 
        type: "database", 
        label: "DATABASE", 
        x: xOffset, 
        y: 220 
      });

      // Skill-aware architecture
      if (skillLevel !== "beginner") {
        nodes.unshift({ 
          id: "n-gateway", 
          type: "gateway", 
          label: "API GATEWAY", 
          x: 120, 
          y: 100 
        });
        // Reposition frontend
        nodes.find((n: Node) => n.id === "n-frontend")!.x = 280;
      }

      // Build edges (connect in order)
      const edges: ExtendedEdge[] = [];
      for (let i = 0; i < nodes.length - 1; i++) {
        edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
      }

      // Add webhook edge if payments
      if (features.includes("payments")) {
        edges.push({ from: "n-payment", to: "n-backend", label: "webhooks" });
      }

      const explanations = [
        `Starter architecture tailored for ${appType} with ${features.length} selected features.`,
        skillLevel === "beginner" 
          ? "Simple 3-tier pattern: Frontend talks to Backend, Backend manages Database."
          : "Intermediate/Advanced: API Gateway handles routing, services are separated for scalability."
      ];

      return {
        step: 1,
        title: "Feature-Aware Starter",
        short: `${appType} baseline with ${features.join(", ")}`,
        nodes,
        edges,
        explanations,
      };
    }

    const starterStep = buildStarterStep(appType, skillLevel, features);

    // Save project with correct structure
    const project = await saveProject({
      title: body.title || `${appType} Project`,
      elevator: body.elevator || `A ${skillLevel} level ${appType} application`,
      must_have_features: body.must_have_features || features,
      constraints: body.constraints || [],
      team_size: body.team_size || 1,
      members: body.members || [],
      status: "draft",
      // Add fields from StudentNewWizard
      appType: appType,
      skillLevel: skillLevel,
      userId: user.userId,
      selectedFeatures: features,
      storeRawLLMOutput: body.storeRawLLMOutput || false,
    });

    console.log('[api] created project', project._id, 'members:', (project.members || []).length);

    // Compute preview immediately
    const preview = computePreviewFromPayload(body);

    // Enqueue job, do not await blocking - start asynchronously
    enqueueSnapshotJob(project._id.toString()).catch(err => {
      console.error('[api] failed to enqueue snapshot job', err);
    });

    return NextResponse.json(
      {
        ok: true,
        project: {
          _id: project._id,
          id: project._id,
          ...project
        },
        projectId: project._id,
        starter: starterStep,
        preview,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string; stack?: string };
    console.error('[api] create project error', error);
    console.error('[api] error stack:', error.stack);
    return NextResponse.json({ 
      error: error.message || "Server error",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    }, { status: error.status || 500 });
  }
}

function computePreviewFromPayload(payload: { title: string; team_size?: number; members?: unknown[] }) {
  const warnings: string[] = [];
  const members = payload.members || [];
  const teamSize = payload.team_size || 1;

  // Example warning: team size mismatch
  if (members.length < teamSize) {
    warnings.push(
      `Only ${members.length} member(s); team_size=${teamSize} => zero full teams.`
    );
  }

  return {
    teams_possible: Math.floor(members.length / teamSize),
    predicted_teams: [], // Placeholder for now
    warnings,
    seed_requested: true
  };
}
