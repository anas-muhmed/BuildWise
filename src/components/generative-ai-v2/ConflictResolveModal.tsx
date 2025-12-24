"use client";

import React, { useState, useEffect } from "react";
import clsx from "clsx";
import { X } from "lucide-react";
import * as api from "@/lib/frontend/api";
import { ConflictItem } from "./AdminConflictQueue";

/**
 * ConflictResolveModal with visual diff preview (before vs after)
 */

interface ConflictResolveModalProps {
  open: boolean;
  conflict: ConflictItem | null;
  projectId: string;
  onClose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onResolved?: (snapshot?: any) => void;
}

export default function ConflictResolveModal({ open, conflict, projectId, onClose, onResolved }: ConflictResolveModalProps) {
  const [action, setAction] = useState("apply_module");
  const [renameTo, setRenameTo] = useState("");
  const [loading, setLoading] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [snapshot, setSnapshot] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [moduleDoc, setModuleDoc] = useState<any | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;

  useEffect(() => {
    if (!open) return;
    setAction("apply_module");
    setRenameTo("");
    // fetch active snapshot + module
    (async () => {
      try {
        const s = await api.fetchLatestSnapshot(projectId, token);
        if (s.ok) setSnapshot(s.snapshot || null);
        else setSnapshot(null);
      } catch {
        setSnapshot(null);
      }
      try {
        if (conflict?.moduleId) {
          const circular = await api.fetchModuleById(projectId, conflict.moduleId, token);
          if (circular.ok) setModuleDoc(circular.module);
          else setModuleDoc(null);
        }
      } catch {
        setModuleDoc(null);
      }
    })();
  }, [open, conflict, projectId, token]);

  if (!open || !conflict) return null;

  // compute preview objects for the conflict target
  const preview = (() => {
    // default before/after
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const before: any = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const after: any = {};

    const parts = String(conflict.id || conflict.code || "").split("::");
    // examples: modId::node::nodeId or modId::edge::from::to
    if (parts.length >= 3 && moduleDoc) {
      const kind = parts[1];
      if (kind === "node") {
        const nodeId = parts[2];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canonNode = (snapshot?.nodes || []).find((n: any) => n.id === nodeId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const moduleNode = (moduleDoc?.nodes || []).find((n: any) => n.id === nodeId);
        before.node = canonNode || null;
        after.node = moduleNode || null;
        // apply "action" mental transform to show expected outcome
        if (action === "apply_module") {
          after.node = moduleNode || moduleNode || null;
        } else if (action === "merge_meta") {
          after.node = { ...(canonNode || {}), ...(moduleNode ? { meta: { ...(canonNode?.meta || {}), ...(moduleNode.meta || {}) } } : {}) };
        } else if (action === "keep_canonical") {
          after.node = canonNode || null;
        } else if (action === "rename_new") {
          after.node = moduleNode ? { ...moduleNode, id: renameTo || moduleNode.id } : null;
        }
      } else if (kind === "edge") {
        const from = parts[2], to = parts[3];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const canonEdge = (snapshot?.edges || []).find((e: any) => e.from === from && e.to === to);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const moduleEdge = (moduleDoc?.edges || []).find((e: any) => e.from === from && e.to === to);
        before.edge = canonEdge || null;
        after.edge = moduleEdge || null;
        if (action === "apply_module") {
          after.edge = moduleEdge || null;
        } else if (action === "merge_meta") {
          after.edge = canonEdge ? { ...canonEdge, meta: { ...(canonEdge.meta || {}), ...(moduleEdge?.meta || {}) } } : moduleEdge;
        } else if (action === "keep_canonical") {
          after.edge = canonEdge || null;
        }
      }
    }
    return { before, after };
  })();

  const handleResolve = async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const params: any = {};
      if (action === "rename_new") params.renameTo = renameTo;
      // note: server route requires admin headers — make sure front-end sets them for dev/testing
      const resp = await api.resolveConflict(projectId, conflict.id, action, params, token);
      if (!resp.ok) throw new Error(resp.error || "resolve failed");
      onResolved?.(resp.snapshot);
      onClose();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert("Resolve failed: " + (err?.message || String(err)));
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderJsonCard = (title: string, obj: any) => (
    <div className="flex-1 bg-zinc-800 p-3 rounded border border-zinc-700">
      <div className="text-xs text-zinc-400 mb-2 font-semibold">{title}</div>
      {obj ? (
        <pre className="max-h-56 overflow-auto text-xs text-zinc-200 whitespace-pre-wrap">{JSON.stringify(obj, null, 2)}</pre>
      ) : (
        <div className="text-xs text-zinc-500">— none —</div>
      )}
    </div>
  );

  return (
    <div className={clsx("fixed inset-0 z-[70] flex items-center justify-center bg-black/45")}>
      <div className="w-[880px] bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Resolve Conflict</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="mb-3 text-sm text-zinc-300">{conflict.message || conflict.id}</div>

        <div className="mb-3 grid grid-cols-12 gap-3">
          <div className="col-span-6">
            <label className="text-xs text-zinc-400 font-medium">Action</label>
            <div className="flex flex-col gap-2 mt-2">
              <label className="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                <input type="radio" name="act" checked={action === "apply_module"} onChange={() => setAction("apply_module")} className="cursor-pointer" />
                <span>Apply module</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                <input type="radio" name="act" checked={action === "merge_meta"} onChange={() => setAction("merge_meta")} className="cursor-pointer" />
                <span>Merge meta</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                <input type="radio" name="act" checked={action === "keep_canonical"} onChange={() => setAction("keep_canonical")} className="cursor-pointer" />
                <span>Keep canonical</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer">
                <input type="radio" name="act" checked={action === "rename_new"} onChange={() => setAction("rename_new")} className="cursor-pointer" />
                <span>Rename new</span>
              </label>
            </div>

            {action === "rename_new" && (
              <div className="mt-3">
                <input 
                  value={renameTo} 
                  onChange={e => setRenameTo(e.target.value)} 
                  placeholder="new node id" 
                  className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-indigo-500" 
                />
              </div>
            )}
          </div>

          <div className="col-span-6">
            <label className="text-xs text-zinc-400 font-medium">Preview</label>
            <div className="mt-2 p-2 bg-zinc-800 rounded text-xs text-zinc-300 border border-zinc-700">
              Action preview: <span className="font-medium text-white ml-2">{action}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 mb-3">
          {renderJsonCard("Before (canonical)", preview.before.node || preview.before.edge || null)}
          {renderJsonCard("After (module / merged)", preview.after.node || preview.after.edge || null)}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-sm transition-colors">Cancel</button>
          <button onClick={handleResolve} disabled={loading} className="px-4 py-2 rounded bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition-colors">{loading ? "Resolving..." : "Confirm"}</button>
        </div>
      </div>
    </div>
  );
}
