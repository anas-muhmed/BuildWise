// src/app/api/generative/projects/[projectId]/audits/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { AuditModel } from "@/lib/backend/models/Audit";
import { requireRoleOrThrow } from "@/lib/backend/auth";

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  try {
    await connectDB();
    
    // only admins / teachers should view audits
    requireRoleOrThrow(req, ["admin", "teacher"]);

    const { projectId } = params;
    const audits = await AuditModel.find({ projectId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ ok: true, audits });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("fetchAudits error", err);
    const status = err?.status || 500;
    return NextResponse.json({ ok: false, error: err?.message || "Failed to fetch audits" }, { status });
  }
}
