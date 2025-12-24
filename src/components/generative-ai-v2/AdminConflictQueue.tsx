"use client";

import React, { useState } from "react";
import clsx from "clsx";
import { X, Check } from "lucide-react";
import ConflictResolveModal from "./ConflictResolveModal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ConflictItem = { id: string; code?: string; type: string; message: string; moduleId: string; resolution?: string; details?: any };

interface Props {
  open: boolean;
  onClose: () => void;
  conflicts: ConflictItem[];
  projectId: string;
  onResolve?: (id: string) => Promise<void> | void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onResolved?: (snapshot?: any) => void;
}

export default function AdminConflictQueue({ open, onClose, conflicts = [], projectId, onResolve, onResolved }: Props) {
  const [selectedConflict, setSelectedConflict] = useState<ConflictItem | null>(null);
  const [resolverOpen, setResolverOpen] = useState(false);

  const handleResolveClick = (c: ConflictItem) => {
    setSelectedConflict(c);
    setResolverOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleResolved = async (snapshot?: any) => {
    setResolverOpen(false);
    setSelectedConflict(null);
    onResolved?.(snapshot);
    if (selectedConflict) {
      await onResolve?.(selectedConflict.id);
    }
  };

  return (
    <>
      <div className={clsx("fixed right-0 top-0 h-full w-[420px] z-60 transform transition-transform", open ? "translate-x-0" : "translate-x-full")}>
        <div className="h-full bg-zinc-950 border-l border-zinc-800 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Admin Conflicts</h3>
            <button onClick={onClose} className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400"><X className="w-4 h-4" /></button>
          </div>

          <div className="flex-1 overflow-auto space-y-3">
            {conflicts.length === 0 && <div className="text-zinc-500 text-sm">No conflicts detected.</div>}
            {conflicts.map(c => (
              <div key={c.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{c.code || c.type}</div>
                    <div className="text-xs text-zinc-400 mt-1">{c.message}</div>
                    {c.resolution && <div className="text-xs text-zinc-300 mt-2">Fix: {c.resolution}</div>}
                    <div className="text-xs text-zinc-500 mt-1">Module: {c.moduleId}</div>
                  </div>
                  <div className="flex flex-col gap-2 ml-3">
                    <button 
                      onClick={() => handleResolveClick(c)} 
                      className="px-3 py-1 rounded bg-green-700 hover:bg-green-600 text-xs text-white flex items-center gap-2 whitespace-nowrap transition-colors"
                    >
                      <Check className="w-3 h-3" /> Resolve
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <p className="text-xs text-zinc-400">Resolve conflicts before finalizing snapshots. Resolutions are recorded in the audit log.</p>
          </div>
        </div>
      </div>

      <ConflictResolveModal 
        open={resolverOpen} 
        conflict={selectedConflict} 
        projectId={projectId} 
        onClose={() => setResolverOpen(false)} 
        onResolved={handleResolved} 
      />
    </>
  );
}
