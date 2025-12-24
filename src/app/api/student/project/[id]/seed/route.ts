// src/app/api/student/project/[id]/seed/route.ts
import { NextResponse } from "next/server";
import { enqueueSnapshotJob } from "@/lib/backend/jobs";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    // Enqueue snapshot job
    await enqueueSnapshotJob(id, {});

    return NextResponse.json({ ok: true, jobId: id });
  } catch (error) {
    console.error("Failed to enqueue snapshot job:", error);
    return NextResponse.json({ ok: false, error: "Failed to enqueue snapshot job." }, { status: 500 });
  }
}