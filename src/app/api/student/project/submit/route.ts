import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { StudentSubmission } from "@/lib/backend/models/StudentSubmission";

export async function POST(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  const { projectId, notes } = await req.json();

  await connectDB();
  const project = await StudentProject.findOne({ _id: projectId, userId: auth.id });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // mark project as submitted
  project.status = "submitted";
  await project.save();

  // create a submission record
  const submission = await StudentSubmission.create({
    projectId: project._id,
    userId: auth.id,
    notes: notes || "",
    architecture: project.architecture,
    status: "submitted",
  });

  // Optionally log (AdminLog entry can be created later when admin acts)
  return NextResponse.json({ ok: true, submission });
}
