// POST /api/admin/submission/[id]/review
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function POST(req: Request, { params }: { params: { id: string }}) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  // Optional admin check
  // if (auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  
  await connectDB();
  const { id } = params;
  const body = await req.json();
  const { action, comment } = body; // action: "approve"|"reject"|"flag"
  
  const project = await StudentProject.findById(id);
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "approve") project.status = "verified";
  else if (action === "reject" || action === "flag") project.status = "flagged";
  
  // Save admin metadata (add these fields to schema if needed)
  // project.verified_by_admin_id = auth.id;
  // project.verified_at = new Date();
  
  await project.save();

  // Optionally store comment in a subcollection or push to project.comments array
  // For now, we'll just acknowledge the action
  
  return NextResponse.json({ ok: true, project });
}
