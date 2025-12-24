"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ModuleCanvas from "@/components/generative-ai-v2/ModuleCanvas";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";

export default function StudentBuilderPage() {
  const params = useParams() as { id: string };
  const projectId = params?.id;
  const router = useRouter();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [fallback, setFallback] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;

  // Create dummy module from snapshot for ModuleCanvas
  const dummyModule = snapshot ? {
    _id: 'student-builder',
    name: 'Student Architecture',
    nodes: snapshot.nodes || [],
    edges: (snapshot.edges || []).map((e: { source: string; target: string; label?: string }) => ({
      from: e.source,
      to: e.target,
      meta: { label: e.label || '' }
    }))
  } : null;

  // Bootstrap snapshot on mount - Master's fix: sessionStorage → API → fallback
  useEffect(() => {
    if (!projectId) return;

    const initCanvas = async () => {
      // Step 1: Try sessionStorage first (FAST PATH from proposal page)
      const key = `snapshot:${projectId}`;
      const stored = sessionStorage.getItem(key);
      if (stored) {
        try {
          const snap = JSON.parse(stored);
          console.log('[builder] ✓ Loaded snapshot from sessionStorage (instant)');
          setSnapshot(snap);
          sessionStorage.removeItem(key); // Clean up after use
          setLoading(false);
          return;
        } catch (e) {
          console.error("[builder] Failed to parse sessionStorage snapshot:", e);
          sessionStorage.removeItem(key); // Clean invalid data
        }
      }

      // Step 2: Fallback to API (slower path)
      console.log('[builder] sessionStorage miss, fetching from API...');
      try {
        const res = await fetch(`/api/student/project/${projectId}/snapshot?mode=latest`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "API request failed");
        }
        
        if (data.ok && data.ready && data.snapshot) {
          console.log('[builder] ✓ Loaded snapshot from API');
          // Cache in sessionStorage for next time
          sessionStorage.setItem(key, JSON.stringify(data.snapshot));
          setSnapshot(data.snapshot);
          setLoading(false);
          return;
        } else {
          console.warn('[builder] Snapshot not ready (ready:', data.ready, ')');
          setFallback(true);
          setLoading(false);
        }
      } catch (err) {
        console.error("[builder] API fetch failed:", err);
        setFallback(true);
        setLoading(false);
      }
    };

    initCanvas();
  }, [projectId, token]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSave = useCallback(async (payload: any) => {
    if (!projectId) throw new Error("no project");
    try {
      const res = await fetch(`/api/student/project/${projectId}/save-architecture`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          nodes: payload.nodes,
          edges: payload.edges,
          modules: payload.modules || []
        })
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "save failed");
      setSnapshot(data.snapshot);
      return data.snapshot;
    } catch (err) {
      console.error("Save error:", err);
      throw err;
    }
  }, [projectId, token]);

  const handleGenerateScaffold = async () => {
    try {
      // Trigger snapshot generation job
      const res = await fetch(`/api/student/project/${projectId}/generate-snapshot`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "generation failed");
      
      // Poll for result
      for (let attempt = 0; attempt < 25; attempt++) {
        await new Promise(r => setTimeout(r, 1000));
        const snapRes = await fetch(`/api/student/project/${projectId}/snapshot?mode=latest`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const snapData = await snapRes.json();
        if (snapData.ok && snapData.ready && snapData.snapshot) {
          setSnapshot(snapData.snapshot);
          setFallback(false);
          return;
        }
      }
      alert("Snapshot generation timed out. Please try again.");
    } catch (err) {
      console.error("Generate scaffold error:", err);
      alert("Failed to generate scaffold. See console.");
    }
  };

  const createLocalScaffold = () => {
    // Master's scaffold fallback - creates basic 3-node architecture
    const scaffold = {
      ready: true,
      version: Date.now(),
      nodes: [
        { 
          id: "n1", 
          type: "frontend", 
          label: "Frontend",
          x: 150, 
          y: 200, 
          meta: { 
            description: "User interface layer",
            tech: "React / Next.js",
            generatedBy: "scaffold" 
          } 
        },
        { 
          id: "n2", 
          type: "backend", 
          label: "Backend",
          x: 400, 
          y: 200, 
          meta: { 
            description: "Business logic & API",
            tech: "Node.js / Express",
            generatedBy: "scaffold" 
          } 
        },
        { 
          id: "n3", 
          type: "database", 
          label: "Database",
          x: 650, 
          y: 200, 
          meta: { 
            description: "Data persistence",
            tech: "PostgreSQL / MongoDB",
            generatedBy: "scaffold" 
          } 
        }
      ],
      edges: [
        { source: "n1", target: "n2", label: "API calls" },
        { source: "n2", target: "n3", label: "queries" }
      ],
      modules: [],
      rationale: "Basic 3-tier scaffold for manual editing",
      ai_feedback: { 
        confidence: "n/a",
        generatedBy: "scaffold" 
      }
    };
    
    console.log('[builder] ✓ Created local scaffold (3 nodes)');
    
    // Store in sessionStorage for consistency
    sessionStorage.setItem(`snapshot:${projectId}`, JSON.stringify(scaffold));
    
    setSnapshot(scaffold);
    setFallback(false);
  };

  if (loading) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="Student Builder">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading architecture...</p>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  if (fallback) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="Student Builder">
        <div className="flex items-center justify-center min-h-[600px]">
          <div className="text-center max-w-lg space-y-6">
            {/* Warning banner */}
            <div className="p-5 bg-amber-900/20 border border-amber-800 rounded-lg text-left">
              <p className="text-amber-400 font-semibold mb-2 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Snapshot not ready
              </p>
              <p className="text-sm text-amber-300/90 mb-4">
                The architecture snapshot hasn&apos;t been generated yet. You have three options to proceed:
              </p>
              <ol className="text-xs text-amber-300/80 space-y-1 list-decimal list-inside">
                <li>Create a basic 3-node scaffold (instant, manual editing)</li>
                <li>Regenerate snapshot (triggers LLM generation)</li>
                <li>Open empty canvas (start from scratch with tutorial)</li>
              </ol>
            </div>
            
            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={createLocalScaffold}
                className="w-full px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors shadow-lg"
              >
                Create Basic Scaffold
                <span className="block text-xs opacity-80 mt-1">Frontend → Backend → Database</span>
              </button>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGenerateScaffold}
                  className="px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  Regenerate
                </button>
                <button
                  onClick={() => { setFallback(false); setSnapshot(null); }}
                  className="px-4 py-2.5 rounded-lg border border-zinc-700 bg-zinc-800 text-zinc-300 text-sm font-medium hover:bg-zinc-700 transition-colors"
                >
                  Open Empty Canvas
                </button>
              </div>
            </div>

            {/* Debug log link (dev only) */}
            {process.env.NODE_ENV === "development" && (
              <div className="pt-4 border-t border-zinc-800">
                <a 
                  href={`/api/student/project/${projectId}/logs`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-zinc-400 underline"
                >
                  View server logs / debug →
                </a>
              </div>
            )}
            
            {/* Back button */}
            <button
              onClick={() => router.push(`/student/${projectId}/proposal`)}
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              ← Back to Proposal
            </button>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  if (!snapshot) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="Student Builder">
        <div className="flex items-center justify-center h-64">
          <p className="text-zinc-400">No snapshot available</p>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="Student Builder">
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
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-300px)] rounded-xl overflow-hidden border border-zinc-800">
          <main className="flex-1 overflow-hidden">
            <ModuleCanvas
              projectId={projectId!}
              module={dummyModule}
              snapshot={snapshot}
              mock={false}
              onSave={handleSave}
            />
          </main>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
