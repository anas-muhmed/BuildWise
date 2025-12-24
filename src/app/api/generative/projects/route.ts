// app/api/generative/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { DraftProject, AuditLog } from "@/lib/backend/models/DraftProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

// 🎯 MASTER PLAN: Phase 0 API - Create DraftProject from starter prompt

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { starter_prompt } = body;

    if (!starter_prompt || typeof starter_prompt !== "string") {
      return NextResponse.json(
        { error: "starter_prompt is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Create DraftProject
    const project = await DraftProject.create({
      owner_id: user.id,
      title: starter_prompt.slice(0, 50), // Use first 50 chars as title
      starter_prompt: starter_prompt.trim(),
      status: "draft",
      current_phase: 0,
      created_at: new Date(),
      updated_at: new Date()
    });

    // Create audit log
    await AuditLog.create({
      project_id: project._id.toString(),
      action: "created",
      by: user.id,
      metadata: { starter_prompt },
      timestamp: new Date()
    });

    return NextResponse.json({
      projectId: project._id.toString(),
      title: project.title,
      status: project.status,
      phase: project.current_phase
    });
  } catch (error) {
    console.error("[generative/projects POST]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Get user's projects
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const projects = await DraftProject.find({ owner_id: user.id })
      .sort({ created_at: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ projects });
  } catch (error) {
    console.error("[generative/projects GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
