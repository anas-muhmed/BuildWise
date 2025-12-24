// app/api/generative/projects/[id]/snapshots/rollback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { rollbackToVersion } from "@/lib/backend/services/snapshotService";
import { getAuthUser } from "@/lib/backend/authMiddleware";

/**
 * 🎯 PHASE 3: Snapshot Rollback API - Master's Implementation
 * POST - Rollback to a previous snapshot version (creates new snapshot with old state)
 */

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = params.id;
    const userId = user.id;
    const body = await req.json();

    if (!body.target_version || typeof body.target_version !== 'number') {
      return NextResponse.json({
        ok: false,
        error: 'Missing or invalid target_version'
      }, { status: 400 });
    }

    await connectDB();

    const newSnapshot = await rollbackToVersion(
      projectId,
      body.target_version,
      userId
    );

    return NextResponse.json({
      ok: true,
      snapshot: newSnapshot,
      message: `Rolled back to version ${body.target_version}. New snapshot v${newSnapshot.version} created.`
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[rollback POST]', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Internal server error'
    }, { status: 500 });
  }
}
