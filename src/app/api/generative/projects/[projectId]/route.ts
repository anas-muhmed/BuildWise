// app/api/generative/projects/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { DraftProject } from "@/lib/backend/models/DraftProject";
import { getAuthUser } from "@/lib/backend/authMiddleware";

// Get single project
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const project = await DraftProject.findOne({
      _id: params.id,
      owner_id: user.id
    }).lean();

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error("[generative/projects/[id] GET]", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
