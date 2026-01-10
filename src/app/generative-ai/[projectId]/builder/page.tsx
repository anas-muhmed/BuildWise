"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ModuleStepper from "@/components/generative-ai-v2/ModuleStepper";
import ModuleCanvas from "@/components/generative-ai-v2/ModuleCanvas";
import ModuleInsights from "@/components/generative-ai-v2/ModuleInsights";
import AdminConflictQueue, { ConflictItem } from "@/components/generative-ai-v2/AdminConflictQueue";
import * as api from "@/lib/frontend/api";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";

export default function BuilderPageClient() {
  const params = useParams() as { projectId: string };
  const projectId = params?.projectId;
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modules, setModules] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
  const [conflictOpen, setConflictOpen] = useState(false);

  const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;

  const loadAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const m = await api.fetchModules(projectId, token);
      if (m.ok) setModules(m.modules || []);
      else setModules([]);
      const s = await api.fetchLatestSnapshot(projectId, token);
      if (s.ok) setSnapshot(s.snapshot || null);
      else setSnapshot(null);
    } catch (err) {
      console.error("loadAll error", err);
    } finally {
      setLoading(false);
    }
  }, [projectId, token]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Poll for snapshot updates if waiting on background jobs (optional)
  useEffect(() => {
    if (!projectId) return;
    const id = setInterval(async () => {
      try {
        const s = await api.fetchLatestSnapshot(projectId, token);
        if (s.ok && s.snapshot && s.snapshot.version !== snapshot?.version) {
          setSnapshot(s.snapshot);
        }
      } catch {
        // ignore
      }
    }, 2000);
    return () => clearInterval(id);
  }, [projectId, snapshot?.version, token]);

  const currentModule = modules[currentIdx];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = useCallback(async (payload: any) => {
    if (!currentModule) throw new Error("no module");
    try {
      const res = await api.saveModuleEdits(projectId!, currentModule._id, { nodes: payload.nodes, edges: payload.edges }, token);
      if (!res.ok) throw new Error(res.error || "save failed");
      // update local module
      setModules(prev => prev.map(m => (m._id === currentModule._id ? res.module : m)));
      return res.module;
    } catch (err) {
      console.error("Save error:", err);
      throw err;
    }
  }, [currentModule, projectId, token]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleApproved = useCallback(async (snap: any) => {
    // after ModuleInsights approve returns snapshot
    setSnapshot(snap);
    setModules(prev => prev.map(m => (m._id === currentModule._id ? { ...m, status: "approved" } : m)));
    // advance index if possible
    setCurrentIdx(i => Math.min(i + 1, modules.length - 1));
  }, [currentModule, modules.length]);

  const handleRejected = useCallback(() => {
    if (!currentModule) return;
    setModules(prev => prev.map(m => (m._id === currentModule._id ? { ...m, status: "rejected" } : m)));
    setCurrentIdx(i => Math.min(i + 1, modules.length - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentModule]);

  const handleReorder = useCallback(async (newOrderIds: string[]) => {
    try {
      const res = await api.reorderModules(projectId!, newOrderIds, token);
      if (!res.ok) throw new Error(res.error || "reorder failed");
      // reorder applied server-side — refresh modules
      await loadAll();
    } catch (err) {
      console.error("reorder failed", err);
      // fallback: reorder locally
      setModules(prev => {
        const map = new Map(prev.map(p => [p._id, p]));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return newOrderIds.map((id: string) => map.get(id)).filter(Boolean) as any[];
      });
    }
  }, [projectId, token, loadAll]);

  const openConflicts = useCallback(async () => {
    setConflictOpen(true);
    try {
      const resp = await api.fetchConflicts(projectId!, token);
      if (resp.ok) setConflicts(resp.conflicts || []);
      else setConflicts([]);
    } catch (err) {
      console.error("fetchConflicts failed", err);
      setConflicts([]);
    }
  }, [projectId, token]);

  const resolveConflict = useCallback(async (id: string) => {
    // simple stub — in real system call backend resolve endpoint
    alert(`Resolve called for ${id} — implement server-side resolver.`);
    setConflicts(prev => prev.filter(c => c.id !== id));
  }, []);

  if (loading) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Module Builder">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading modules...</p>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Module Builder">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-zinc-400">No modules found</p>
            <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded bg-indigo-600 text-white">Go Back</button>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Module Builder">
      <div className="space-y-4">
        {/* Header */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="text-zinc-400 hover:text-white">Back</button>
              <div className="h-6 w-px bg-zinc-700" />
              <h1 className="text-xl font-semibold text-white">Architecture Builder</h1>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-sm text-zinc-400">
                Snapshot: <span className="font-medium text-white">v{snapshot?.version || 0}</span>
              </div>
              <div className="text-sm text-zinc-400">
                Module {currentIdx + 1} of {modules.length}
              </div>
              <button onClick={openConflicts} className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-sm">Conflicts</button>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-300px)] rounded-xl overflow-hidden border border-zinc-800">
          <aside id="stepper-panel" className="w-72 bg-zinc-900 border-r border-zinc-800 overflow-y-auto">
            <ModuleStepper
              modules={modules}
              currentIndex={currentIdx}
              onSelectModule={(i) => setCurrentIdx(i)}
              onReorder={handleReorder}
            />
          </aside>

          <main className="flex-1 overflow-hidden">
            <ModuleCanvas
              projectId={projectId!}
              module={currentModule}
              snapshot={snapshot}
              mock={false}
              onSave={handleSave}
            />
          </main>

          <aside className="w-96 bg-zinc-900 border-l border-zinc-800 overflow-y-auto">
            <ModuleInsights
              projectId={projectId!}
              module={currentModule}
              snapshot={snapshot}
              mock={false}
              onApproved={handleApproved}
              onModified={() => {
                // show edit modal in parent: reuse existing NodeEditor control if you have it
                alert("Open node editor (implement UI hook)");
              }}
              onRejected={handleRejected}
            />
          </aside>
        </div>
      </div>

      <AdminConflictQueue 
        open={conflictOpen} 
        onClose={() => setConflictOpen(false)} 
        conflicts={conflicts} 
        projectId={projectId}
        onResolve={resolveConflict}
        onResolved={(snap) => {
          if (snap) setSnapshot(snap);
          loadAll();
        }}
      />
    </DashboardLayoutWrapper>
  );
}
