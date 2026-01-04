// app/api/generative/projects/[projectId]/finalize/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { DraftProject } from "@/lib/backend/models/DraftProject";
import { Module } from "@/lib/backend/models/Module";
import { ArchitectureSnapshot } from "@/lib/backend/models/ArchitectureSnapshot";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { generateReadinessReport } from "@/lib/backend/services/readinessAnalyzer";
import { estimateCosts } from "@/lib/backend/services/costEstimator";

/**
 * 🎯 Master's Finalize Endpoint
 * GET - Final review page data: snapshot + readiness + costs
 */

export async function GET(
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

    await connectDB();

    // Get project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await DraftProject.findById(projectId).lean() as any;
    if (!project) {
      return NextResponse.json({ 
        ok: false, 
        error: 'project_not_found' 
      }, { status: 404 });
    }

    // Get latest snapshot
    const snapshot = await ArchitectureSnapshot.findOne({ 
      project_id: projectId 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }).sort({ version: -1 }).lean() as any;

    if (!snapshot) {
      return NextResponse.json({ 
        ok: false, 
        error: 'no_snapshot_found',
        message: 'No modules have been approved yet'
      }, { status: 404 });
    }

    // Get all modules for metadata
    const modules = await Module.find({ projectId: projectId }).lean();
    const approvedCount = modules.filter(m => m.status === 'approved').length;

    // Generate readiness report (use project requirements if available)
    const readinessReport = generateReadinessReport(
      snapshot.nodes,
      {
        features: project.requirements?.must_have_features || [],
        traffic: project.requirements?.traffic,
        budget: project.requirements?.budget
      }
    );

    // Estimate costs
    const costEstimate = estimateCosts(
      snapshot.nodes,
      {
        traffic: project.requirements?.traffic,
        budget: project.requirements?.budget,
        storageGB: undefined, // Can be added to requirements later
        requestsPerMonth: undefined
      }
    );

    return NextResponse.json({
      ok: true,
      project: {
        id: project._id,
        name: project.starter_prompt,
        status: project.status
      },
      snapshot: {
        version: snapshot.version,
        nodes: snapshot.nodes,
        edges: snapshot.edges,
        modules: snapshot.modules,
        createdAt: snapshot.created_at
      },
      modules: {
        total: modules.length,
        approved: approvedCount,
        proposed: modules.filter(m => m.status === 'proposed').length
      },
      readinessReport,
      costEstimate,
      iacAvailable: true // IaC generation available
    });
  } catch (err) {
    console.error('[finalize GET]', err);
    return NextResponse.json({ 
      ok: false, 
      error: 'server_error' 
    }, { status: 500 });
  }
}
