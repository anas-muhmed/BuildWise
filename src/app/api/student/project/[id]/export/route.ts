// GET /api/student/project/[id]/export
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/projects";
import { requireRoleOrThrow } from "@/lib/backend/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);
    await connectDB();

    const { id: projectId } = await params;
    const project = await StudentProject.findById(projectId).lean();

    if (!project) {
      return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
    }

    // Auth check: allow access if user owns project or is admin/teacher
    if (project.userId && project.userId.toString() !== user.userId && user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Return complete project snapshot for export
    return NextResponse.json({ ok: true, project }, { status: 200 });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message || "Server error" }, { status: error.status || 500 });
  }
}
