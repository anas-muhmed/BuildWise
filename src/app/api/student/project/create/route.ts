import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { getAuthUser } from "@/lib/backend/authMiddleware";
import { StudentProject } from "@/lib/backend/models/StudentProject";

export async function POST(req: Request) {
  const auth = getAuthUser(req);
  if (auth instanceof NextResponse) return auth;

  const body = await req.json();
  const { appType, skillLevel } = body;
  if (!appType) return NextResponse.json({ error: "appType required" }, { status: 400 });

  await connectDB();
  const project = await StudentProject.create({
    userId: auth.id,
    appType,
    skillLevel: skillLevel || "beginner",
    selectedFeatures: [],
    steps: [],
    architecture: { nodes: [], edges: [] },
    explanations: [],
  });

  return NextResponse.json({ project });
}
