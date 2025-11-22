import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { StudentProject } from "@/lib/backend/models/StudentProject";

export async function POST(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { projectId, architecture } = body;

  if (!projectId || !architecture) {
    return NextResponse.json(
      { error: "projectId and architecture required" },
      { status: 400 }
    );
  }

  await connectDB();

  const project = await StudentProject.findOne({ _id: projectId, userId: auth.id });
  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  // Update architecture
  project.architecture = architecture;
  await project.save();

  return NextResponse.json({ message: "Architecture saved" }, { status: 200 });
}
