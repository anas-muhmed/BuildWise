// src/app/api/student/project/[id]/snapshot/route.ts
import { NextResponse } from "next/server";
import { getLatestSnapshot } from "@/lib/backend/snapshots";

export async function GET(req: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  try {
    console.log('[api] snapshot request', id);
    const snapshot = await getLatestSnapshot(id);
    console.log('[api] snapshot found:', !!snapshot);

    if (!snapshot) {
      return NextResponse.json({ ok: false, ready: false });
    }

    return NextResponse.json({ ok: true, ready: true, snapshot });
  } catch (error) {
    console.error("[api] Failed to fetch snapshot:", error);
    return NextResponse.json({ ok: false, error: "Failed to fetch snapshot." }, { status: 500 });
  }
}