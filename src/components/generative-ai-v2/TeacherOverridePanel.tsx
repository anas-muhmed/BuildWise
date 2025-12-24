"use client";

import React, { useEffect, useState } from "react";
import { bulkApproveModules } from "@/lib/frontend/api";
import { Button } from "@/components/ui/button";
import clsx from "clsx";

type Module = {
  _id: string;
  name: string;
  status: string;
  order: number;
};

type TeacherOverridePanelProps = {
  projectId: string;
  modules?: Module[];
  onUpdated?: (updated: Module[]) => void;
};

/**
 * Teacher Override Panel - allows bulk approve/reject operations
 * Props:
 * - projectId: string
 * - modules: [{ _id, name, status, order, ... }]
 * - onUpdated: callback after operation completes
 */
export default function TeacherOverridePanel({ 
  projectId, 
  modules = [], 
  onUpdated 
}: TeacherOverridePanelProps) {
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Reset selection when modules change
    const initial: Record<string, boolean> = {};
    (modules || []).forEach((m: Module) => initial[m._id] = false);
    setSelected(initial);
  }, [modules]);

  const toggle = (id: string) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const selectedIds = Object.keys(selected).filter(k => selected[k]);

  const perform = async (action: "approve" | "reject") => {
    if (!selectedIds.length) {
      alert("Select modules first");
      return;
    }
    
    setLoading(true);
    try {
      const token = typeof window !== "undefined" 
        ? localStorage.getItem("token") || undefined 
        : undefined;
      const res = await bulkApproveModules(projectId, selectedIds, action, token);
      
      if (!res.ok) throw new Error(res.error || "failed");
      
      onUpdated?.(res.updated || []);
      
      // Clear selection
      setSelected({});
    } catch (e: unknown) {
      const error = e as { message?: string };
      alert("Operation failed: " + (error?.message || String(e)));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-3">
      <div className="text-sm text-white font-medium">Teacher Override</div>
      <div className="text-xs text-zinc-400">
        Select modules and approve/reject in bulk.
      </div>
      
      <div className="max-h-48 overflow-auto mt-2 space-y-1">
        {(modules || []).map((m: Module) => (
          <label 
            key={m._id} 
            className="flex items-center gap-2 p-2 rounded hover:bg-zinc-800 cursor-pointer"
          >
            <input 
              type="checkbox" 
              checked={!!selected[m._id]} 
              onChange={() => toggle(m._id)}
              className="cursor-pointer"
            />
            <div className="text-xs text-white flex-1">{m.name}</div>
            <div className={clsx(
              "ml-auto text-[11px] px-2 py-0.5 rounded",
              m.status === "approved" 
                ? "bg-emerald-800 text-emerald-200" 
                : "bg-zinc-800 text-zinc-300"
            )}>
              {m.status}
            </div>
          </label>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <Button 
          onClick={() => perform("approve")} 
          disabled={loading || selectedIds.length === 0}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          Bulk Approve ({selectedIds.length})
        </Button>
        <Button 
          onClick={() => perform("reject")} 
          disabled={loading || selectedIds.length === 0}
          variant="outline" 
          className="text-red-500 border-red-500 hover:bg-red-950"
        >
          Bulk Reject ({selectedIds.length})
        </Button>
      </div>
    </div>
  );
}
