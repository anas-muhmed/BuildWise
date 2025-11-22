import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { StudentProject } from "@/lib/backend/models/StudentProject";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();

  const projectId = params.id;
  const project = await StudentProject.findOne({ _id: projectId, userId: auth.id });

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  return NextResponse.json({ project }, { status: 200 });
}
