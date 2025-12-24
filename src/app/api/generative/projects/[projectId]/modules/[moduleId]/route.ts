import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { ModuleModel } from "@/lib/backend/models/Module";

export async function GET(req: Request, { params }: { params: { projectId: string, moduleId: string } }) {
  try {
    await connectDB();
    const moduleDoc = await ModuleModel.findById(params.moduleId).lean();
    if (!moduleDoc) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    return NextResponse.json({ ok: true, module: moduleDoc });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "failed" }, { status: 500 });
  }
}
