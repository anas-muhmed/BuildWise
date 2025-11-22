// GET /api/student/project/[id]/export
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  const projectId = params.id;
  const project = await StudentProject.findOne({ _id: projectId, userId: auth.id }).lean();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Return complete project snapshot for export
  return NextResponse.json({ project }, { status: 200 });
}
