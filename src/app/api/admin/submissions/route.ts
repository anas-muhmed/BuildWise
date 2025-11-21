// app/api/admin/submissions/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentSubmission } from "@/lib/backend/models/StudentSubmission";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  if (auth.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const q = new URL(req.url).searchParams;
  const page = parseInt(q.get("page") || "1");
  const per = Math.min(parseInt(q.get("per") || "20"), 100);
  const skip = (page - 1) * per;

  const total = await StudentSubmission.countDocuments();
  const subs = await StudentSubmission.find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(per)
    .populate("userId", "name email")
    .populate("projectId", "appType")
    .lean();

  return NextResponse.json({ submissions: subs, meta: { total, page, per } });
}
