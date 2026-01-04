// app/api/generative/projects/[projectId]/snapshots/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/backend/mongodb";
import { getLatestSnapshot, getSnapshotHistory, getSnapshotDiff } from "@/lib/backend/services/snapshotService";
import { getAuthUser } from "@/lib/backend/authMiddleware";

/**
 * 🎯 PHASE 3: Snapshot API - Master's Implementation
 * GET - Get latest snapshot or full history
 */

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const user = await getAuthUser(req);
    if (!user || user instanceof NextResponse) {
      return user || NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const projectId = resolvedParams.projectId;
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('mode'); // 'latest', 'history', 'diff'
    const fromVersion = searchParams.get('from_version');
    const toVersion = searchParams.get('to_version');

    await connectDB();

    if (mode === 'history') {
      const history = await getSnapshotHistory(projectId);
      return NextResponse.json({ ok: true, history });
    }

    if (mode === 'diff' && fromVersion && toVersion) {
      const diff = await getSnapshotDiff(
        projectId,
        parseInt(fromVersion),
        parseInt(toVersion)
      );
      return NextResponse.json({ ok: true, diff });
    }

    // Default: get latest snapshot
    const snapshot = await getLatestSnapshot(projectId);
    return NextResponse.json({ ok: true, snapshot });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error('[snapshots GET]', err);
    return NextResponse.json({
      ok: false,
      error: err.message || 'Internal server error'
    }, { status: 500 });
  }
}
