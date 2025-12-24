// src/app/api/generative/projects/[projectId]/modules/[moduleId]/approve/route.ts
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/db";
import { ModuleModel } from "@/lib/backend/models/Module";
import { createSnapshotFromApproved } from "@/lib/backend/services/mergeEngine";

export async function PATCH(req: Request, { params }: { params: { projectId: string, moduleId: string } }) {
  try {
    await connectDB();
    const { projectId, moduleId } = params;

    // Mark module approved
    const mod = await ModuleModel.findByIdAndUpdate(moduleId, { status: "approved" }, { new: true }).lean();
    if (!mod) return NextResponse.json({ ok: false, error: "module not found" }, { status: 404 });

    // Build canonical snapshot and persist (immutable new snapshot created)
    const snapshot = await createSnapshotFromApproved(projectId, (req as any).headers?.get("x-user-id") || "system");

    return NextResponse.json({ ok: true, module: mod, snapshot });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ ok: false, error: "Approve failed" }, { status: 500 });
  }
}
