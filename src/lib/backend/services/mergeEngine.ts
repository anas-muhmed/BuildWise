// lib/backend/services/mergeEngine.ts - MASTER'S STUDENT MODE V2.5
import { ModuleModel, IModule } from "../models/Module";
import { SnapshotModel } from "../models/Snapshot";

/**
 * 🎯 MASTER'S MERGE ENGINE - DETERMINISTIC RULES
 * 
 * Basic merge rules:
 * - Nodes deduped by id (canonical)
 * - If node id exists, merge meta with preference: module.ai_feedback.confidence === high -> override
 * - Edges deduped by from|to combination; if meta differs, keep union
 *
 * This is intentionally simple and deterministic. Expand as needed.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MergeResult = { nodes: any[], edges: any[], modules: string[] };

export async function buildCanonicalFromApproved(projectId: string): Promise<MergeResult> {
  const approvedModules = await ModuleModel.find({ projectId, status: "approved" }).sort({ order: 1 }).lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nodeMap = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const edgeMap = new Map<string, any>();
  const moduleIds: string[] = [];

  for (const mod of approvedModules) {
    moduleIds.push(String(mod._id));
    for (const n of mod.nodes || []) {
      const key = n.id;
      if (!nodeMap.has(key)) {
        nodeMap.set(key, { ...n });
      } else {
        // merge meta: prefer existing, but allow override if this module has high confidence
        const existing = nodeMap.get(key);
        const incoming = n;
        const incomingConf = mod.ai_feedback?.confidence;
        if (incomingConf === "high") {
          nodeMap.set(key, { ...existing, ...incoming, meta: { ...existing.meta, ...incoming.meta } });
        } else {
          nodeMap.set(key, { ...existing, meta: { ...existing.meta, ...incoming.meta } });
        }
      }
    }

    for (const e of mod.edges || []) {
      const key = `${e.from}::${e.to}`;
      if (!edgeMap.has(key)) edgeMap.set(key, e);
      else {
        // merge meta union
        const ex = edgeMap.get(key);
        edgeMap.set(key, { ...ex, meta: { ...(ex.meta||{}), ...(e.meta||{}) } });
      }
    }
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges: Array.from(edgeMap.values()),
    modules: moduleIds
  };
}

export async function createSnapshotFromApproved(projectId: string, author = "system") {
  const Snapshot = SnapshotModel;
  const { nodes, edges, modules } = await buildCanonicalFromApproved(projectId);

  // find latest version
  const last = await Snapshot.find({ projectId }).sort({ version: -1 }).limit(1).lean();
  const nextVersion = (last && last[0]) ? (last[0].version + 1) : 1;

  // Deactivate previous snapshots
  await Snapshot.updateMany({ projectId, active: true }, { $set: { active: false } });

  const snap = await Snapshot.create({
    projectId,
    version: nextVersion,
    modules,
    nodes,
    edges,
    author,
    active: true
  });

  return snap;
}

// Keep old function for backward compatibility
export async function mergeModuleIntoSnapshot(
  projectId: string, 
  moduleDoc: IModule, 
  approverId: string
) {
  return createSnapshotFromApproved(projectId, approverId);
}
