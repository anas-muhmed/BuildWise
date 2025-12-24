// app/api/generative/projects/[id]/requirements/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { DraftProject, AuditLog } from "@/lib/backend/models/DraftProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

// 🎯 MASTER PLAN: Phase 1 API - Save structured requirements

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { requirements } = body;

    if (!requirements) {
      return NextResponse.json(
        { error: "requirements object is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await DraftProject.findOne({
      _id: params.id,
      owner_id: user.id
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Update requirements and phase
    project.requirements = requirements;
    project.current_phase = 1;
    project.updated_at = new Date();
    await project.save();

    // Audit log
    await AuditLog.create({
      project_id: params.id,
      action: "requirements_saved",
      by: user.id,
      metadata: { requirements },
      timestamp: new Date()
    });

    return NextResponse.json({
      success: true,
      phase: project.current_phase
    });
  } catch (error) {
    console.error("[requirements PATCH]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
