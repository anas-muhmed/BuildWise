import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { requireRoleOrThrow } from "@/lib/backend/auth";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { StudentSubmission } from "@/lib/backend/models/StudentSubmission";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRoleOrThrow(req, ["student", "teacher", "admin"]);
    await connectDB();
  
    const body = await req.json();
    const { projectId, notes } = body;
    
    if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    
    const project = await StudentProject.findById(projectId);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (project.userId.toString() !== user.userId && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Structured validation with actionable suggestions
    const errors: any[] = [];

    const arch = project.architecture || { nodes: [], edges: [] };
    if (!arch.nodes || arch.nodes.length === 0) {
      errors.push({ code: "ARCH_EMPTY", msg: "Architecture is empty", suggestion: "Generate at least one step with nodes and edges" });
    }
    if (!project.roles || project.roles.length === 0) {
      errors.push({ code: "ROLES_MISSING", msg: "Roles not generated", suggestion: "Run role generation in Feature Planning" });
    }
    if (!project.milestones || project.milestones.length === 0) {
      errors.push({ code: "MILESTONES_MISSING", msg: "Milestones missing", suggestion: "Generate roles to auto-create milestones" });
    }
    if (project.skillLevel === "beginner") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const labels = (arch.nodes || []).map((n:any)=> (n.label||"").toLowerCase());
      if (!labels.some((l:string)=> l.includes("frontend"))) {
        errors.push({ code: "MISSING_FRONTEND", msg: "Frontend layer missing", suggestion: "Add a frontend node (UI) in Architecture" });
      }
      if (!labels.some((l:string)=> l.includes("backend"))) {
        errors.push({ code: "MISSING_BACKEND", msg: "Backend layer missing", suggestion: "Add a backend node (API) in Architecture" });
      }
    }

    if (errors.length) {
      return NextResponse.json({ ok: false, errors }, { status: 400 });
    }

    // Mark project as submitted
    project.status = "submitted";
    await project.save();

    // Create submission record
    const submissionId = uuidv4();
    const submission = await StudentSubmission.create({
      projectId: project._id,
      userId: auth.id,
      notes: notes || "",
      architecture: project.architecture,
      status: "submitted",
    });

    return NextResponse.json({ ok: true, submissionId, submission });
  } catch (err:any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
