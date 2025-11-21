import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;
  await connectDB();
  const p = await StudentProject.findOne({ _id: params.id, userId: auth.id }).lean();
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ project: p });
}
