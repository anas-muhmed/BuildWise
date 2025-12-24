import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { requireRoleOrThrow } from "@/lib/backend/auth";
import { StudentProject } from "@/lib/backend/models/StudentProject";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);

    const body = await req.json();
    const { projectId, architecture } = body;

    if (!projectId || !architecture) {
      return NextResponse.json(
        { error: "projectId and architecture required" },
        { status: 400 }
      );
    }

    await connectDB();

    const project = await StudentProject.findById(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.userId.toString() !== user.userId && user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update architecture
    project.architecture = architecture;
    await project.save();

    return NextResponse.json({ message: "Architecture saved" }, { status: 200 });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message || "Server error" }, { status: error.status || 500 });
  }
}
