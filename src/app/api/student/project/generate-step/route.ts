import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { generateStudentArchitecture } from "@/lib/mockStudentGenerator";

export async function POST(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  const { projectId, stepIndex, constraints } = await req.json(); // stepIndex optional

  await connectDB();
  const project = await StudentProject.findOne({ _id: projectId, userId: auth.id });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  // generate based on project metadata
  const payload = generateStudentArchitecture({
    appType: project.appType,
    skillLevel: project.skillLevel,
    constraints: constraints || {},
  });

  // create a new step container (append)
  const nextStepNum = (project.steps?.length || 0) + 1;
  const step = { step: nextStepNum, title: `Step ${nextStepNum}`, nodes: payload.nodes, edges: payload.edges };

  project.steps = project.steps || [];
  project.steps.push(step);
  // update overall architecture with cumulative nodes/edges (simple merge)
  project.architecture = { nodes: payload.nodes, edges: payload.edges };
  project.explanations = payload.explanations || [];
  project.aiScore = payload.metadata?.aiScore || null;

  await project.save();
  return NextResponse.json({ project, step });
}
