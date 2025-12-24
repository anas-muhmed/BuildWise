// src/lib/backend/services/conflictResolver.ts
import { SnapshotModel } from "@/lib/backend/models/Snapshot";
import { ModuleModel } from "@/lib/backend/models/Module";
import { AuditModel } from "@/lib/backend/models/Audit";

/**
 * resolveConflictService
 *
 * Inputs:
 * - projectId: string
 * - conflictId: string (format: `${modId}::node::${nodeId}` or `${modId}::node::${nodeId}::meta` or `${modId}::edge::${from}::${to}`)
 * - action: "keep_canonical" | "apply_module" | "merge_meta" | "rename_new"
 * - params?: { renameTo?: string }
 * - actor?: userId string for audit
 *
 * Behavior:
 * - Performs resolution (modifies in-memory canonical nodes/edges or module doc)
 * - Creates a new immutable snapshot if canonical changes
 * - Writes an audit record
 * - Returns { ok: true, snapshot, audit }
 *
 * Note: This function assumes DB is connected externally.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResolveResult = { ok: boolean; snapshot?: any; audit?: any; message?: string };

export async function resolveConflictService({
  projectId,
  conflictId,
  action,
  params,
  actor = "admin"
}: {
  projectId: string;
  conflictId: string;
  action: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
  actor?: string;
}): Promise<ResolveResult> {
  // Basic validation
  if (!conflictId || !action) return { ok: false, message: "conflictId & action required" };

  const parts = String(conflictId).split("::");
  if (parts.length < 3) return { ok: false, message: "invalid conflictId format" };

  const [modId, kind, ...rest] = parts;
  const moduleDoc = await ModuleModel.findById(modId).lean();
  if (!moduleDoc) return { ok: false, message: "module not found" };

  // load active snapshot
  const active = await SnapshotModel.findOne({ projectId, active: true }).lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canonicalNodes = (active?.nodes || []).map((n: any) => ({ ...n }));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const canonicalEdges = (active?.edges || []).map((e: any) => ({ ...e }));

  let modified = false;

  const createNewSnapshot = async () => {
    await SnapshotModel.updateMany({ projectId, active: true }, { $set: { active: false } });
    const last = await SnapshotModel.find({ projectId }).sort({ version: -1 }).limit(1).lean();
    const nextVersion = (last && last[0]) ? (last[0].version + 1) : 1;
    const snap = await SnapshotModel.create({
      projectId,
      version: nextVersion,
      modules: active?.modules || [],
      nodes: canonicalNodes,
      edges: canonicalEdges,
      author: actor,
      active: true
    });
    return snap;
  };

  if (kind === "node") {
    const nodeId = rest[0];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const canonIdx = canonicalNodes.findIndex((n: any) => n.id === nodeId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moduleNode = (moduleDoc.nodes || []).find((n: any) => n.id === nodeId);
    if (!moduleNode) return { ok: false, message: "module node not found" };

    if (action === "keep_canonical") {
      // just audit
      const audit = await AuditModel.create({ projectId, conflictId, action, actor, details: { note: "kept canonical" } });
      return { ok: true, snapshot: active || null, audit };
    }

    if (action === "apply_module") {
      if (canonIdx >= 0) {
        canonicalNodes[canonIdx] = { ...canonicalNodes[canonIdx], ...moduleNode };
      } else {
        canonicalNodes.push(moduleNode);
      }
      modified = true;
    } else if (action === "merge_meta") {
      if (canonIdx >= 0) {
        canonicalNodes[canonIdx].meta = { ...(canonicalNodes[canonIdx].meta || {}), ...(moduleNode.meta || {}) };
      } else {
        canonicalNodes.push(moduleNode);
      }
      modified = true;
    } else if (action === "rename_new") {
      const renameTo = params?.renameTo;
      if (!renameTo) return { ok: false, message: "renameTo required" };
      await ModuleModel.updateOne({ _id: modId, "nodes.id": nodeId }, { $set: { "nodes.$.id": renameTo } });
      const audit = await AuditModel.create({ projectId, conflictId, action, actor, details: { renameTo } });
      return { ok: true, snapshot: active || null, audit };
    } else {
      return { ok: false, message: "unsupported node action" };
    }
  } else if (kind === "edge") {
    const from = rest[0], to = rest[1];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const moduleEdge = (moduleDoc.edges || []).find((e: any) => e.from === from && e.to === to);
    if (!moduleEdge) return { ok: false, message: "module edge not found" };

    if (action === "keep_canonical") {
      const audit = await AuditModel.create({ projectId, conflictId, action, actor, details: { note: "kept canonical" } });
      return { ok: true, snapshot: active || null, audit };
    }

    if (action === "apply_module") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const exists = canonicalEdges.find((e: any) => e.from === from && e.to === to);
      if (!exists) canonicalEdges.push(moduleEdge);
      modified = true;
    } else if (action === "merge_meta") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const idx = canonicalEdges.findIndex((e: any) => e.from === from && e.to === to);
      if (idx >= 0) canonicalEdges[idx].meta = { ...(canonicalEdges[idx].meta || {}), ...(moduleEdge.meta || {}) };
      else canonicalEdges.push(moduleEdge);
      modified = true;
    } else {
      return { ok: false, message: "unsupported edge action" };
    }
  } else {
    return { ok: false, message: "unsupported conflict kind" };
  }

  if (modified) {
    const snapshot = await createNewSnapshot();
    const audit = await AuditModel.create({ projectId, conflictId, action, actor, details: { modified: true } });
    return { ok: true, snapshot, audit };
  }

  return { ok: true, snapshot: active || null };
}
