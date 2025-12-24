// app/api/admin/submissions/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentSubmissionModel } from "@/lib/backend/models/StudentSubmission";
import { requireRoleOrThrow } from "@/lib/backend/auth";

/**
 * List student submissions
 * GET /api/admin/submissions?page=1&limit=20
 * Only teacher/admin allowed
 */
export async function GET(req: Request) {
  try {
    await connectDB();
    requireRoleOrThrow(req, ["teacher", "admin"]);
    
    const url = new URL(req.url);
    const page = Number(url.searchParams.get("page") || "1");
    const limit = Math.min(Number(url.searchParams.get("per") || url.searchParams.get("limit") || "20"), 100);
    const skip = (page - 1) * limit;
    
    const docs = await StudentSubmissionModel
      .find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    const total = await StudentSubmissionModel.countDocuments();
    
    return NextResponse.json({ 
      ok: true,
      submissions: docs, 
      meta: { total, page, per: limit }
    });
  } catch (err: unknown) {
    const error = err as { status?: number; message?: string };
    return NextResponse.json(
      { ok: false, error: error?.message || "internal" }, 
      { status: error?.status || 500 }
    );
  }
}
