// app/api/admin/submissions/[id]/review/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentSubmissionModel } from "@/lib/backend/models/StudentSubmission";
import { AuditModel } from "@/lib/backend/models/Audit";
import { requireRoleOrThrow } from "@/lib/backend/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Review a student submission
 * Body: { action: "approve"|"reject"|"request_changes", notes?: string, grade?: number }
 * Only teacher/admin allowed
 */
export async function POST(req: Request, context: RouteContext) {
  try {
    await connectDB();
    const user = requireRoleOrThrow(req, ["teacher", "admin"]);
    const { action, notes, grade } = await req.json();
    const { id } = await context.params;
    
    const submission = await StudentSubmissionModel.findById(id);
    if (!submission) {
      return NextResponse.json(
        { ok: false, error: "not found" }, 
        { status: 404 }
      );
    }
    
    // Update submission status based on action
    submission.status = 
      action === "approve" ? "approved" : 
      action === "reject" ? "rejected" : 
      "reviewed";
    
    if (notes) {
      submission.notes = notes;
    }
    
    if (grade !== undefined) {
      submission.set("grade", grade);
    }
    
    await submission.save();
    
    // Create audit record
    await AuditModel.create({ 
      projectId: submission.projectId, 
      action: `submission_${action}`, 
      actor: user.userId, 
      details: { submissionId: submission._id, notes, grade } 
    });
    
    return NextResponse.json({ ok: true, submission });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json(
      { ok: false, error: error?.message || "internal" }, 
      { status: error?.status || 500 }
    );
  }
}
