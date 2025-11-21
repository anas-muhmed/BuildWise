import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { StudentProject } from "@/lib/backend/models/StudentProject";

export async function POST(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  const { projectId, selectedFeatures } = await req.json();
  if (!projectId || !Array.isArray(selectedFeatures)) return NextResponse.json({ error: "Invalid" }, { status: 400 });

  await connectDB();
  const project = await StudentProject.findOne({ _id: projectId, userId: auth.id });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  project.selectedFeatures = selectedFeatures;
  await project.save();
  return NextResponse.json({ project });
}
