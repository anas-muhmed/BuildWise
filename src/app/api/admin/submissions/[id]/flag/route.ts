// app/api/admin/submissions/[id]/flag/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentSubmission } from "@/lib/backend/models/StudentSubmission";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { AdminLog } from "@/lib/backend/models/AdminLog";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = params.id;
  const body = await req.json();
  const reason = body?.reason || "flagged by admin";

  await connectDB();
  const submission = await StudentSubmission.findById(id);
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  submission.status = "flagged";
  await submission.save();

  await StudentProject.findByIdAndUpdate(submission.projectId, { status: "flagged" });

  await AdminLog.create({
    adminId: auth.id,
    designId: submission.projectId,
    action: "submission:flag",
    meta: { submissionId: id, reason },
    ip: req.headers.get("x-forwarded-for") || "unknown",
    userAgent: req.headers.get("user-agent") || "",
  });

  return NextResponse.json({ ok: true, submissionId: id });
}
