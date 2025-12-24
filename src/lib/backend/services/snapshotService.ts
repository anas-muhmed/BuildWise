// lib/backend/services/snapshotService.ts
import { ArchitectureSnapshot } from "../models/ArchitectureSnapshot";
import { AuditLog } from "../models/DraftProject";
import mongoose from "mongoose";

/**
 * 🎯 PHASE 3: Snapshot Service - Rollback & History
 * Master's spec: Immutable snapshots, rollback by selecting active version
 */

/**
 * Get latest snapshot for a project
 */
export async function getLatestSnapshot(projectId: string | mongoose.Types.ObjectId) {
  const snapshot = await ArchitectureSnapshot.findOne({ project_id: projectId })
    .sort({ version: -1 })
    .lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return snapshot as any; // Mongoose lean() typing issue
}

/**
 * Get specific snapshot version
 */
export async function getSnapshotByVersion(
  projectId: string | mongoose.Types.ObjectId, 
  version: number
) {
  const snapshot = await ArchitectureSnapshot.findOne({ 
    project_id: projectId, 
    version 
  }).lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return snapshot as any; // Mongoose lean() typing issue
}

/**
 * Get all snapshots for a project (for history view)
 */
export async function getSnapshotHistory(projectId: string | mongoose.Types.ObjectId) {
  return await ArchitectureSnapshot.find({ project_id: projectId })
    .sort({ version: -1 })
    .lean();
}

/**
 * Rollback to a previous snapshot version
 * Master's rule: Don't modify past snapshots, create new snapshot pointing to old state
 */
export async function rollbackToVersion(
  projectId: string | mongoose.Types.ObjectId,
  targetVersion: number,
  userId: string
) {
  // Get the target snapshot
  const targetSnapshot = await getSnapshotByVersion(projectId, targetVersion);
  
  if (!targetSnapshot) {
    throw new Error(`Snapshot version ${targetVersion} not found`);
  }

  // Get current latest version
  const latestSnapshot = await getLatestSnapshot(projectId);
  const newVersion = (latestSnapshot?.version || 0) + 1;

  // Create new snapshot with rolled-back state
  const rolledBackSnapshot = new ArchitectureSnapshot({
    project_id: projectId,
    modules: targetSnapshot.modules,
    nodes: targetSnapshot.nodes,
    edges: targetSnapshot.edges,
    version: newVersion,
    created_by: userId,
    created_at: new Date()
  });

  await rolledBackSnapshot.save();

  // Audit log
  await AuditLog.create({
    project_id: projectId,
    action: 'snapshot_rolled_back',
    by: userId,
    reason: `Rolled back from v${latestSnapshot?.version} to v${targetVersion}`,
    metadata: { 
      from_version: latestSnapshot?.version,
      to_version: targetVersion,
      new_version: newVersion
    }
  });

  return rolledBackSnapshot;
}

/**
 * Get snapshot diff between two versions
 */
export async function getSnapshotDiff(
  projectId: string | mongoose.Types.ObjectId,
  fromVersion: number,
  toVersion: number
) {
  const [fromSnap, toSnap] = await Promise.all([
    getSnapshotByVersion(projectId, fromVersion),
    getSnapshotByVersion(projectId, toVersion)
  ]);

  if (!fromSnap || !toSnap) {
    throw new Error("One or both snapshot versions not found");
  }

  // Calculate added/removed nodes and edges
  interface NodeLike { id: string; }
  interface EdgeLike { from: string; to: string; }
  
  const fromNodeIds = new Set(fromSnap.nodes.map((n: NodeLike) => n.id));
  const toNodeIds = new Set(toSnap.nodes.map((n: NodeLike) => n.id));

  const addedNodes = toSnap.nodes.filter((n: NodeLike) => !fromNodeIds.has(n.id));
  const removedNodes = fromSnap.nodes.filter((n: NodeLike) => !toNodeIds.has(n.id));

  const fromEdgeKeys = new Set(fromSnap.edges.map((e: EdgeLike) => `${e.from}→${e.to}`));
  const toEdgeKeys = new Set(toSnap.edges.map((e: EdgeLike) => `${e.from}→${e.to}`));

  const addedEdges = toSnap.edges.filter((e: EdgeLike) => !fromEdgeKeys.has(`${e.from}→${e.to}`));
  const removedEdges = fromSnap.edges.filter((e: EdgeLike) => !toEdgeKeys.has(`${e.from}→${e.to}`));

  return {
    from_version: fromVersion,
    to_version: toVersion,
    added_nodes: addedNodes,
    removed_nodes: removedNodes,
    added_edges: addedEdges,
    removed_edges: removedEdges,
    node_count_change: toSnap.nodes.length - fromSnap.nodes.length,
    edge_count_change: toSnap.edges.length - fromSnap.edges.length
  };
}
