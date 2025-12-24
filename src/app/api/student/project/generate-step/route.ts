import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { requireRoleOrThrow } from "@/lib/backend/auth";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { generateStudentArchitecture } from "@/lib/mockStudentGenerator";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);
    const { projectId, stepIndex, constraints } = await req.json();

    await connectDB();
    const project = await StudentProject.findById(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    
    if (project.userId.toString() !== user.userId && user.role !== "admin" && user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // generate based on project metadata + selected features
  const payload = generateStudentArchitecture({
    appType: project.appType,
    skillLevel: project.skillLevel,
    constraints: constraints || {},
    selectedFeatures: project.selectedFeatures || [], // pass features for node injection
    currentStep: (project.steps?.length || 0) + 1, // helps guide what to add next
  });

  // create a new step container (append)
  const nextStepNum = (project.steps?.length || 0) + 1;
  const step = { 
    step: nextStepNum, 
    title: payload.stepTitle || `Step ${nextStepNum}`, 
    nodes: payload.nodes, 
    edges: payload.edges,
    implementationGuide: payload.implementationGuide || {}, // NEW: how-to-implement per skill
  };

  project.steps = project.steps || [];
  project.steps.push(step);
  // update overall architecture with cumulative nodes/edges (simple merge)
  project.architecture = { nodes: payload.nodes, edges: payload.edges };
  project.explanations = payload.explanations || [];
  project.aiScore = payload.metadata?.aiScore || null;

    await project.save();
    return NextResponse.json({ project, step });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json({ error: error.message || "Server error" }, { status: error.status || 500 });
  }
}
