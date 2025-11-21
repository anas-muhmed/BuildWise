import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { StudentProject } from "@/lib/backend/models/StudentProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

export async function GET(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  await connectDB();
  
  const projects = await StudentProject.find({ userId: auth.id })
    .sort({ updatedAt: -1 })
    .lean();

  return NextResponse.json({ projects });
}
