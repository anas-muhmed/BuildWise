import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { requireRoleOrThrow } from "@/lib/backend/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);
    await connectDB();
  
    const query: Record<string, unknown> = {};
    if (user.role === "student") {
      query.userId = user.userId;
    }
    // Teachers and admins see all projects

    const projects = await StudentProject.find(query)
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json({ projects });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message || "Server error" }, { status: error.status || 500 });
  }
}
