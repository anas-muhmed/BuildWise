// app/api/generative/projects/[projectId]/publish/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { DraftProject, AuditLog } from "@/lib/backend/models/DraftProject";
import { ArchitectureSnapshot } from "@/lib/backend/models/ArchitectureSnapshot";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { generateIaC } from "@/lib/backend/services/iacGenerator";

/**
 * 🎯 Master's Publish Endpoint
 * POST - Mark snapshot as published + generate IaC bundle
 */

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.projectId;
    const body = await req.json();
    const { snapshotVersion, target = "staging", deployOptions } = body;

    await connectDB();

    // Get project
    const project = await DraftProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ 
        ok: false, 
        error: 'project_not_found' 
      }, { status: 404 });
    }

    // Get snapshot
    const snapshot = snapshotVersion
      ? await ArchitectureSnapshot.findOne({ project_id: projectId, version: snapshotVersion })
      : await ArchitectureSnapshot.findOne({ project_id: projectId }).sort({ version: -1 });

    if (!snapshot) {
      return NextResponse.json({ 
        ok: false, 
        error: 'snapshot_not_found' 
      }, { status: 404 });
    }

    // Generate IaC bundle
    const iacBundle = generateIaC(
      snapshot.nodes,
      project.starter_prompt?.slice(0, 30).replace(/[^a-zA-Z0-9-]/g, '-') || 'project'
    );

    // Mark snapshot as published (add published_at field)
    snapshot.published_at = new Date();
    snapshot.published_by = user.id;
    snapshot.target_env = target;
    await snapshot.save();

    // Update project status
    project.status = 'published';
    await project.save();

    // Audit log
    await AuditLog.create({
      project_id: projectId,
      action: 'snapshot_published',
      by: user.id,
      reason: `Published to ${target}`,
      metadata: { 
        snapshotVersion: snapshot.version,
        target,
        deployOptions 
      }
    });

    // In a real system, you'd:
    // 1. Upload IaC bundle to S3/artifact store
    // 2. Trigger CI/CD pipeline
    // 3. Return pipeline URL

    return NextResponse.json({
      ok: true,
      message: `Snapshot v${snapshot.version} published to ${target}`,
      snapshot: {
        version: snapshot.version,
        publishedAt: snapshot.published_at
      },
      iacBundle: {
        terraform: iacBundle.terraform.slice(0, 200) + '...',
        githubActions: iacBundle.githubActions.slice(0, 200) + '...',
        available: true
      },
      runbookUrl: `/api/generative/projects/${projectId}/runbook`,
      pipelineUrl: `https://github.com/your-org/${project.starter_prompt}/actions` // Mock
    });
  } catch (err) {
    console.error('[publish POST]', err);
    return NextResponse.json({ 
      ok: false, 
      error: 'server_error' 
    }, { status: 500 });
  }
}
