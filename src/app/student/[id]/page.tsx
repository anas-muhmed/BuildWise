// src/app/student/[id]/page.tsx
"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavHeader from "@/components/NavHeader";

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

/**
 * Simple node renderer (not a full canvas lib) — positions nodes horizontally.
 * Expects nodes: [{ id, label, meta? }] edges: [{ from, to }]
 */

export default function StudentEditorPage() {
  const router = useRouter();
  const params = useParams() as { id?: string };
  const projectId = params?.id || "";

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewArch, setViewArch] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/student/project/${projectId}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to load project");
      setProject(data.project);
      // default view to latest architecture or step 1
      if (data.project.architecture?.nodes?.length) {
        setViewArch({ nodes: data.project.architecture.nodes, edges: data.project.architecture.edges });
      } else if (data.project.steps && data.project.steps.length) {
        const last = data.project.steps[data.project.steps.length - 1];
        setViewArch({ nodes: last.nodes || [], edges: last.edges || [] });
      } else {
        setViewArch({ nodes: [], edges: [] });
      }
      setSelectedStep(data.project.steps?.length ? data.project.steps.length : null);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Error loading");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Generate next step: call backend route which should append a step to project and return it
  async function generateNextStep() {
    if (!projectId) return;
    setBusy(true);
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
      if (!res.ok) throw new Error(json?.error || "generate-step failed");

      // server should return { step, nodes, edges, explanations }
      const stepObj = json.step;
      // update local project copy
      const updated = { ...project };
      updated.steps = updated.steps || [];
      updated.steps.push(stepObj);

      // optionally update persistent architecture (we keep latest)
      updated.architecture = { nodes: stepObj.nodes || [], edges: stepObj.edges || [] };

      // update local state and save back
      setProject(updated);
      setViewArch({ nodes: stepObj.nodes || [], edges: stepObj.edges || [] });
      setSelectedStep(updated.steps.length);
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Failed to generate step");
    } finally {
      setBusy(false);
    }
  }

  // Save the current viewArch into project.architecture (persist to server)
  async function saveArchitecture() {
    if (!projectId) return;
    setBusy(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch("/api/student/project/save-architecture", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId, architecture: viewArch }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "save failed");
      // refresh
      await loadProject();
      alert("Architecture saved.");
    } catch (e: unknown) {
      console.error(e);
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  // Load a particular step from project.steps into viewArch
  function loadStep(stepNum: number) {
    if (!project || !project.steps) return;
    const s = project.steps[stepNum - 1];
    if (!s) return;
    setViewArch({ nodes: s.nodes || [], edges: s.edges || [] });
    setSelectedStep(stepNum);
  }

  // Simple renderer for nodes and edges
  function Canvas({ nodes, edges }: { nodes: any[]; edges: any[] }) {
    // determine positions
    const w = 900;
    const h = 420;
    const count = nodes.length || 0;
    const startX = 80;
    const gap = count > 1 ? Math.max(140, (w - 160) / Math.max(1, count - 1)) : 0;

    const positioned = (nodes || []).map((n:any,i:number) => {
      const x = startX + i * gap;
      const y = 160 + (Math.sin(i)*10); // tiny variance for visual interest
      return { ...n, x, y };
    });

    // map edges to coordinates
    const edgePaths = (edges || []).map((e:any, idx:number) => {
      const from = positioned.find((p:any) => p.id === e.from) || positioned[e.from] || null;
      const to = positioned.find((p:any) => p.id === e.to) || positioned[e.to] || null;
      if (!from || !to) return null;
      const sx = from.x + 80;
      const sy = from.y + 12;
      const tx = to.x - 20;
      const ty = to.y + 12;
      // simple cubic curve
      const cx1 = sx + (tx - sx) * 0.3;
      const cx2 = sx + (tx - sx) * 0.7;
      const d = `M ${sx} ${sy} C ${cx1} ${sy} ${cx2} ${ty} ${tx} ${ty}`;
      return { d, key: idx, sx, sy, tx, ty };
    }).filter(Boolean);

    return (
      <div className="bg-white rounded-lg border p-4 shadow">
        <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ maxWidth: "100%", height: 420 }}>
          <defs>
            <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* edges */}
          {edgePaths.map((ep:any) => (
            <path key={ep.key} d={ep.d} stroke="#3b82f6" strokeWidth={3} fill="none" strokeLinecap="round" style={{ opacity: 0.95 }} />
          ))}

          {/* nodes */}
          {positioned.map((n:any, idx:number) => (
            <g key={n.id || idx} transform={`translate(${n.x}, ${n.y})`}>
              <foreignObject x={-60} y={-24} width={140} height={48}>
                <div className="p-2 border rounded-md" style={{ background: "#fff", border: "1px solid #c7ddff", boxShadow: "0 2px 6px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{n.label || n.title || `Node ${idx+1}`}</div>
                  <div style={{ fontSize: 11, color: "#666" }}>{n.type || (n.meta && n.meta.description) || ""}</div>
                </div>
              </foreignObject>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  // Render step history list
  function StepHistory() {
    const steps = project?.steps || [];
    return (
      <div className="bg-white rounded-xl shadow p-4 mb-4">
        <h4 className="font-semibold mb-2">Steps</h4>
        <div className="space-y-2 text-sm">
          {steps.length === 0 && <div className="text-gray-500">No steps yet. Click &quot;Generate Next Step&quot;.</div>}
          {steps.map((s:any, idx:number) => (
            <div
              key={s.step || idx}
              onClick={() => loadStep(idx + 1)}
              className={`p-2 cursor-pointer rounded border ${selectedStep === idx + 1 ? "bg-blue-50 border-blue-400" : "hover:bg-gray-50"}`}
            >
              <div className="flex justify-between">
                <div>Step {idx + 1}</div>
                <div className="text-xs text-gray-500">{(s.nodes||[]).length} nodes</div>
              </div>
              <div className="text-xs text-gray-600">{s.short || (s.explanations && s.explanations[0]) || "Generated step"}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Submit with pre-validation
  async function handleSubmit() {
    if (!project) return;
    // local quick checks
    const arch = project.architecture || { nodes: [], edges: [] };
    const errors: string[] = [];
    if (!arch.nodes || arch.nodes.length === 0) errors.push("Architecture is empty — generate at least one step.");
    if (!project.roles || project.roles.length === 0) errors.push("Roles not generated. Click 'Update Roles' in Feature Planning.");
    if (!project.milestones || project.milestones.length === 0) errors.push("Milestones missing. Generate roles to auto-create milestones.");
    if (project.skillLevel === "beginner") {
      const labels = (arch.nodes || []).map((n:any) => (n.label||"").toLowerCase());
      if (!labels.some((l:string)=>l.includes("frontend")) || !labels.some((l:string)=>l.includes("backend"))) {
        errors.push("Beginner projects must include both frontend and backend layers.");
      }
    }
    if (errors.length) {
      // show modal or alert with actionable items
      alert("Fix the following before submitting:\n\n- " + errors.join("\n- "));
      return;
    }

    // server submit
    try {
      const token = getToken();
      const res = await fetch("/api/student/project/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ projectId: project._id })
      });
      const json = await res.json();
      if (!res.ok) {
        // server returns structured errors: { errors: [{code,msg,field,suggestion}] }
        if (json?.errors) {
          const msgs = json.errors.map((e:any)=> `${e.msg} ${e.suggestion ? " — Fix: "+e.suggestion : ""}` ).join("\n");
          alert("Submission failed:\n\n" + msgs);
        } else {
          throw new Error(json?.error || "Submit failed");
        }
        return;
      }
      alert("Project submitted for review. Submission ID: " + (json.submissionId || "N/A"));
      // reload project to update status
      await loadProject();
    } catch (err:any) {
      alert(err instanceof Error ? err.message : "Submit failed");
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <NavHeader />
        <div className="p-6">Loading project...</div>
      </ProtectedRoute>
    );
  }

  if (!project) {
    return (
      <ProtectedRoute>
        <NavHeader />
        <div className="p-6">
          <div className="text-red-600">Project not found or loading failed.</div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <NavHeader />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
          {/* Left: Steps */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl p-4 shadow mb-4">
              <div className="text-sm text-gray-600">Project ID</div>
              <div className="font-mono text-xs break-all">{project._id}</div>
              <div className="mt-3 text-xs text-gray-500">Status: {project.status}</div>
            </div>

            <StepHistory />

            {/* Roles card reused */}
            <div className="bg-white rounded-xl p-4 shadow mb-4">
              <h4 className="font-semibold mb-2">Roles</h4>
              {project.roles && project.roles.length ? (
                <ul className="text-sm space-y-2">
                  {project.roles.map((r:any) => (
                    <li key={r.id} className="p-2 border rounded">
                      <div className="font-medium">{r.title}</div>
                      <div className="text-xs text-gray-500">{r.description}</div>
                      <ul className="text-xs list-disc ml-4">
                        {r.tasks.map((t:string, i:number) => <li key={i}>{t}</li>)}
                      </ul>
                    </li>
                  ))}
                </ul>
              ) : <div className="text-sm text-gray-500">No roles yet</div>}
            </div>

            {/* Milestones */}
            <div className="bg-white rounded-xl p-4 shadow">
              <h4 className="font-semibold mb-2">Milestones</h4>
              {project.milestones && project.milestones.length ? (
                <ul className="text-sm space-y-2">
                  {project.milestones.map((m:any) => (
                    <li key={m.id} className="flex items-start gap-2">
                      <input type="checkbox" checked={!!m.done} readOnly className="mt-1" />
                      <div>
                        <div className="font-medium">{m.title}</div>
                        <div className="text-xs text-gray-500">{m.description}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : <div className="text-sm text-gray-500">No milestones</div>}
            </div>

          </div>

          {/* Center: Canvas */}
          <div className="col-span-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Student Mode — Editor</h2>
              <div className="flex gap-2">
                <button onClick={generateNextStep} disabled={busy} className="px-3 py-2 bg-indigo-600 text-white rounded">Generate Next Step</button>
                <button onClick={saveArchitecture} disabled={busy} className="px-3 py-2 border rounded">Save Architecture</button>
                <button onClick={async () => {
                  try {
                    const token = getToken();
                    const res = await fetch(`/api/student/project/${project._id}/export`, {
                      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                    });
                    const j = await res.json();
                    const a = document.createElement("a");
                    const blob = new Blob([JSON.stringify(j, null, 2)], { type: "application/json" });
                    a.href = URL.createObjectURL(blob);
                    a.download = `${project._id}_snapshot.json`;
                    a.click();
                  } catch (e) {
                    alert("Export failed");
                  }
                }} disabled={busy} className="px-3 py-2 border rounded">Export JSON</button>
                <button onClick={handleSubmit} disabled={busy} className="px-3 py-2 bg-green-600 text-white rounded">Submit for Review</button>
              </div>
            </div>

            <Canvas nodes={viewArch.nodes} edges={viewArch.edges} />

            {/* Explanations */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {(project.steps && project.steps.length) ? project.steps.slice(Math.max(0, project.steps.length-4)).reverse().map((s:any, i:number) => (
                <div key={i} className="bg-white p-3 rounded shadow">
                  <div className="text-xs text-gray-500">Step {s.step}</div>
                  <div className="font-medium">{s.short || "Step summary"}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    {(s.explanations || []).map((ex:string, idx:number) => <div key={idx} className="mb-2 text-sm">{ex}</div>)}
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-500">No explanations yet. Generate a step.</div>
              )}
            </div>
          </div>

          {/* Right: Project summary + tips */}
          <div className="col-span-3">
            <div className="bg-white rounded-xl p-4 shadow mb-4">
              <h4 className="font-semibold mb-2">Project Summary</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div><strong>App:</strong> {project.appType}</div>
                <div><strong>Skill:</strong> {project.skillLevel}</div>
                <div><strong>Features:</strong> {(project.selectedFeatures || []).join(", ") || "none"}</div>
                <div><strong>Steps:</strong> {(project.steps || []).length}</div>
                <div><strong>AI Score:</strong> {project.aiScore ?? "—"}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <h4 className="font-semibold mb-2">Tips</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>Generate one step at a time and review explanations.</li>
                <li>Save architecture after edits so teachers can view it.</li>
                <li>Use Roles to split work among teammates.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </ProtectedRoute>
  );
}
