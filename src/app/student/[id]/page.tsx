"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavHeader from "@/components/NavHeader";

/**
 * Student Mode Editor Page
 * - Loads a StudentProject
 * - Renders architecture (nodes + edges)
 * - Generate Next Step (calls POST /api/student/project/generate-step)
 * - Submit Project for review (POST /api/student/project/submit)
 *
 * Notes:
 * - Expects auth token in localStorage key "token"
 * - Adjust API paths if your server route differs
 */

type Node = { id: string; label: string; x: number; y: number };
type Edge = { source: string; target: string };

type StudentProject = {
  _id: string;
  appType: string;
  skillLevel: "beginner" | "intermediate" | "advanced";
  selectedFeatures: string[];
  steps: { step: number; title: string; nodes: Node[]; edges: Edge[] }[];
  architecture: { nodes: Node[]; edges: Edge[] };
  explanations: string[];
  aiScore?: number | null;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function StudentProjectEditorInner() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const projectId = params?.id;

  const [project, setProject] = useState<StudentProject | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [displayedExplanations, setDisplayedExplanations] = useState<string[]>([]);
  const [selectedStepIndex, setSelectedStepIndex] = useState<number | null>(null);

  // Load project
  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const token = getToken();
        const res = await fetch(`/api/student/project/get/${projectId}`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load project");
        setProject(json.project);
        // show initial explanations if available
        if (json.project.explanations?.length) {
          setDisplayedExplanations([]);
          // animate typing-like reveal
          let idx = 0;
          const iv = setInterval(() => {
            setDisplayedExplanations((prev) => [...prev, json.project.explanations[idx]]);
            idx++;
            if (idx >= json.project.explanations.length) clearInterval(iv);
          }, 600);
        } else {
          setDisplayedExplanations([]);
        }
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Error loading project");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  // Compute centers for SVG edges
  const nodeCenters = useMemo(() => {
    const map = new Map<string, { cx: number; cy: number }>();
    const nodes = project?.architecture?.nodes || [];
    nodes.forEach((n) => {
      map.set(n.id, { cx: n.x + 60, cy: n.y + 20 }); // same assumptions as other canvas
    });
    return map;
  }, [project?.architecture]);

  // Helper: draw edges as quadratic bezier
  function renderEdges(edges: Edge[]) {
    return edges.map((e, i) => {
      const src = nodeCenters.get(e.source);
      const tgt = nodeCenters.get(e.target);
      if (!src || !tgt) return null;
      const midX = (src.cx + tgt.cx) / 2;
      const controlY = (src.cy + tgt.cy) / 2 - 30;
      const path = `M ${src.cx} ${src.cy} Q ${midX} ${controlY} ${tgt.cx} ${tgt.cy}`;
      return (
        <path
          key={`${e.source}-${e.target}-${i}`}
          d={path}
          stroke="#2563eb"
          strokeWidth={2.5}
          fill="none"
          strokeLinecap="round"
          markerEnd="url(#arrowhead)"
          opacity={0.95}
        />
      );
    });
  }

  // Generate next step
  async function handleGenerateStep() {
    if (!projectId) return;
    setGenerating(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch("/api/student/project/generate-step", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to generate step");
      const updatedProject: StudentProject = json.project;
      setProject(updatedProject);

      // show the newly added step as selected
      if (updatedProject.steps && updatedProject.steps.length > 0) {
        setSelectedStepIndex(updatedProject.steps.length - 1);
      }

      // animate explanations again
      setDisplayedExplanations([]);
      if (updatedProject.explanations?.length) {
        let idx = 0;
        const iv = setInterval(() => {
          setDisplayedExplanations((prev) => [...prev, updatedProject.explanations[idx]]);
          idx++;
          if (idx >= updatedProject.explanations.length) clearInterval(iv);
        }, 600);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  // Submit project
  async function handleSubmit(notes?: string) {
    if (!projectId) return;
    if (!confirm("Submit this project for review? You can still iterate in a new copy. This will set status=submitted.")) return;
    setSubmitLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch("/api/student/project/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, notes: notes || "" }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Submit failed");
      // On success, project.status should be "submitted". Reload or update
      // Let's refresh project by calling GET
      const reload = await fetch(`/api/student/project/get/${projectId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const reloadJson = await reload.json();
      if (reload.ok && reloadJson.project) {
        setProject(reloadJson.project);
      }
      alert("Project submitted for review.");
      // Optionally navigate to student's projects page
      router.push("/student");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitLoading(false);
    }
  }

  // Render step list
  function StepsList() {
    if (!project) return null;
    const steps = project.steps || [];
    if (steps.length === 0) {
      return <div className="text-sm text-gray-500 py-4">No steps yet — click &quot;Generate step&quot; to start.</div>;
    }
    return (
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div
            key={i}
            onClick={() => {
              setSelectedStepIndex(i);
              // set architecture to that step temporarily (client-side view)
              setProject((prev) => {
                if (!prev) return prev;
                // we won't mutate server state; just set architecture for viewing
                return { ...prev, architecture: { nodes: s.nodes, edges: s.edges } };
              });
            }}
            className={`p-3 border rounded hover:shadow cursor-pointer ${selectedStepIndex === i ? "border-blue-400 bg-blue-50" : "border-gray-100"}`}
          >
            <div className="flex justify-between items-center">
              <div className="font-medium">{s.title || `Step ${s.step}`}</div>
              <div className="text-xs text-gray-500">nodes: {s.nodes?.length || 0}</div>
            </div>
            <div className="text-xs text-gray-600 mt-1">{/* small preview text if you want */}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* Left: Canvas and actions */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl p-4 shadow flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Student Mode — Editor</h2>
              <p className="text-sm text-slate-500">Project ID: <code className="bg-gray-100 px-2 py-0.5 rounded">{project?._id || projectId}</code></p>
            </div>

            <div className="flex gap-2 items-center">
              <div className="text-sm text-slate-600">Status: <span className="font-medium">{project?.status || "loading"}</span></div>
              <button
                onClick={handleGenerateStep}
                disabled={generating || !!(project?.status && project.status !== "draft")}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded disabled:opacity-60"
              >
                {generating ? "Generating..." : "Generate step"}
              </button>

              <button
                onClick={() => handleSubmit()}
                disabled={submitLoading || project?.status === "submitted" || !project}
                className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-60"
              >
                {submitLoading ? "Submitting..." : "Submit for Review"}
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div className="bg-white rounded-xl border border-gray-200 h-[520px] overflow-hidden relative">
            {/* SVG */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
              <defs>
                <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto" markerUnits="strokeWidth">
                  <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
                </marker>
              </defs>

              {/* edges */}
              {project?.architecture?.edges && renderEdges(project.architecture.edges)}

            </svg>

            {/* nodes rendered as HTML via foreignObject */}
            <div className="absolute inset-0 pointer-events-auto">
              <svg width="100%" height="100%">
                <defs />
                {project?.architecture?.nodes?.map((n) => (
                  <foreignObject key={n.id} x={n.x} y={n.y} width={140} height={48}>
                    <div>
                      <div className="bg-white border-2 border-gray-200 rounded-lg shadow px-2 py-2 text-sm font-semibold flex items-center justify-center">
                        {n.label}
                      </div>
                    </div>
                  </foreignObject>
                ))}
              </svg>
            </div>

            {/* Loading and empty states */}
            {!project && !loading && <div className="absolute inset-0 flex items-center justify-center text-slate-400">No project loaded.</div>}
            {loading && <div className="absolute inset-0 flex items-center justify-center bg-white/80">Loading project...</div>}
          </div>

          {/* Explanations and AI Score */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="col-span-2 bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2">AI Explanations</h3>
              {displayedExplanations.length === 0 && <div className="text-sm text-gray-500">No explanations yet. Generate a step.</div>}
              <ul className="space-y-3">
                {displayedExplanations.map((t, idx) => (
                  <li key={idx} className="text-sm text-gray-700">{t}</li>
                ))}
              </ul>
            </div>

            <div className="col-span-1 bg-white p-4 rounded-xl shadow">
              <h3 className="font-semibold mb-2">AI Score</h3>
              <div className="text-3xl font-bold text-indigo-600">{project?.aiScore ?? "—"}</div>
              <div className="mt-2 text-xs text-gray-500">Higher = better. This is a mock score for demo.</div>
            </div>
          </div>
        </div>

        {/* Right: Steps list, metadata, preview */}
        <div className="col-span-4">
          <div className="bg-white rounded-xl p-4 shadow mb-4">
            <h4 className="font-semibold mb-2">Steps</h4>
            <StepsList />
          </div>

          <div className="bg-white rounded-xl p-4 shadow mb-4">
            <h4 className="font-semibold mb-2">Project Info</h4>
            <div className="text-sm text-gray-700">App type: <span className="font-medium">{project?.appType}</span></div>
            <div className="text-sm text-gray-700">Skill level: <span className="font-medium">{project?.skillLevel}</span></div>
            <div className="text-sm text-gray-700">Features: <span className="font-medium">{(project?.selectedFeatures || []).join(", ") || "none"}</span></div>
            <div className="text-sm text-gray-500 mt-2">Created: {project?.createdAt ? new Date(project.createdAt).toLocaleString() : "-"}</div>
            <div className="mt-3 text-xs text-gray-400">Status: {project?.status}</div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <h4 className="font-semibold mb-2">UI Reference</h4>
            <div className="w-full h-36 bg-gradient-to-br from-indigo-50 to-blue-100 rounded flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl mb-2">🎓</div>
                <div className="text-sm font-medium text-slate-700">Student Mode</div>
                <div className="text-xs text-slate-500">Step-by-step Architecture</div>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">Reference UI placeholder</div>
          </div>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed right-6 bottom-6 bg-red-600 text-white px-4 py-2 rounded shadow">
          <div className="flex items-center gap-3">
            <div>Error</div>
            <div className="text-sm opacity-90">{error}</div>
            <button className="ml-2 opacity-80" onClick={() => setError(null)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentProjectEditorPage() {
  return (
    <ProtectedRoute>
      <NavHeader />
      <StudentProjectEditorInner />
    </ProtectedRoute>
  );
}
