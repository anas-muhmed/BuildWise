import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { requireRoleOrThrow } from "@/lib/backend/auth";
import { StudentProject } from "@/lib/backend/projects";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);
    await connectDB();

    const { id: projectId } = await params;
    const project = await StudentProject.findById(projectId);

    if (!project) {
      return NextResponse.json({ ok: false, error: "Project not found" }, { status: 404 });
    }

    // Auth check: allow access if user owns project or is admin/teacher
    if (project.userId && project.userId.toString() !== user.userId && user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    console.log('[api] GET project', projectId, 'members:', (project.members || []).length);
    console.log('[api] Full project object:', JSON.stringify(project, null, 2));
    return NextResponse.json({ ok: true, project }, { status: 200 });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message || "Server error" }, { status: error.status || 500 });
  }
}
