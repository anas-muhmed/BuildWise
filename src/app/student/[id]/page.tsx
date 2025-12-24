// src/app/student/[id]/page.tsx
"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
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

/**
 * Fit nodes into an SVG viewBox and return { viewBox, scale }
 */
function computeViewBox(nodes: { x: number; y: number; width?: number; height?: number }[], padding = 80) {
  if (!nodes || nodes.length === 0) return { viewBox: `0 0 900 500`, scale: 1 };
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = Math.max(400, maxX - minX + padding * 2);
  const height = Math.max(300, maxY - minY + padding * 2);
  const vbX = minX - padding;
  const vbY = minY - padding;
  return { viewBox: `${vbX} ${vbY} ${width} ${height}`, scale: 1 };
}

export default function StudentEditorPage() {
  const params = useParams() as { id?: string };
  const projectId = params?.id || "";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewArch, setViewArch] = useState<{ nodes: any[]; edges: any[] }>({ nodes: [], edges: [] });
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [svgViewBox, setSvgViewBox] = useState<string>("0 0 900 500");
  const [zoom, setZoom] = useState<number>(1);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

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
      alert("Failed to generate step");
    } finally {
      setBusy(false);
    }
  }

  // Save the current viewArch into project.architecture (persist to server)
  async function saveArchitecture() {
    if (!projectId) return;
    setBusy(true);
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
      alert("Save failed");
    } finally {
      setBusy(false);
    }
  }

  // Auto-fit viewBox whenever viewArch changes
  useEffect(() => {
    const nodes = viewArch?.nodes || [];
    // If nodes have no x/y, auto-layout horizontally
    const hasCoords = nodes.every((n: any) => typeof n.x === "number");
    if (!hasCoords && nodes.length > 0) {
      const w = Math.max(120, (nodes.length ? Math.floor(900 / Math.max(1, nodes.length)) : 120));
      nodes.forEach((n: any, i: number) => {
        n.x = 100 + i * (w + 60);
        n.y = 220;
      });
      setViewArch(prev => ({ ...prev, nodes }));
    }
    const vb = computeViewBox(nodes, 120);
    setSvgViewBox(vb.viewBox);
    setZoom(1);
  }, [viewArch]);

  // Zoom handlers
  function zoomIn() { setZoom(z => Math.min(2.5, +(z + 0.2).toFixed(2))); }
  function zoomOut() { setZoom(z => Math.max(0.5, +(z - 0.2).toFixed(2))); }
  function resetZoom() { setZoom(1); }

  // Load a particular step from project.steps into viewArch
  function loadStep(stepNum: number) {
    if (!project || !project.steps) return;
    const s = project.steps[stepNum - 1];
    if (!s) return;
    setViewArch({ nodes: s.nodes || [], edges: s.edges || [] });
    setSelectedStep(stepNum);
  }

  // Toggle role expansion
  function toggleRoleExpand(roleId: string) {
    setExpandedRoles(prev => {
      const next = new Set(prev);
      if (next.has(roleId)) next.delete(roleId);
      else next.add(roleId);
      return next;
    });
  }

  // Enhanced Canvas renderer with auto-fit and zoom
  function Canvas({ nodes, edges }: { nodes: any[]; edges: any[] }) {
    return (
      <div className="bg-white rounded-lg border p-4 shadow">
        <svg
          viewBox={svgViewBox}
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            width: "100%", 
            height: 520, 
            overflow: "visible", 
            transformOrigin: "center", 
            transform: `scale(${zoom})`,
            transition: "transform 0.2s ease"
          }}
        >
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
          {edges?.map((e, idx) => {
            const src = nodes.find((n: any) => n.id === e.from);
            const tgt = nodes.find((n: any) => n.id === e.to);
            if (!src || !tgt) return null;
            const sx = src.x + 80;
            const sy = src.y + 20;
            const tx = tgt.x;
            const ty = tgt.y + 20;
            const cx1 = sx + (tx - sx) * 0.35;
            const cx2 = sx + (tx - sx) * 0.65;
            const d = `M ${sx} ${sy} C ${cx1} ${sy} ${cx2} ${ty} ${tx} ${ty}`;
            return <path key={idx} d={d} stroke="#6b46c1" strokeWidth={3} fill="none" strokeLinecap="round" style={{ opacity: 0.95 }} />;
          })}

          {/* nodes */}
          {nodes?.map((n: any) => (
            <foreignObject key={n.id} x={n.x - 60} y={n.y - 20} width={160} height={60}>
              <div
                style={{
                  width: "160px",
                  height: "60px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px",
                  borderRadius: "12px",
                  background: "#fff",
                  boxShadow: "0 6px 18px rgba(11,15,30,0.06)",
                  border: "1px solid rgba(99,102,241,0.12)",
                  fontSize: 13,
                  lineHeight: "1.1",
                  textAlign: "center",
                  whiteSpace: "pre-line",
                  fontWeight: 600
                }}
              >
                {n.label}
              </div>
            </foreignObject>
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

            {/* Roles card with milestone-grouped tasks */}
            <div className="bg-white rounded-xl p-4 shadow mb-4">
              <h4 className="font-semibold mb-2">Roles & Tasks</h4>
              {project.roles && project.roles.length ? (
                <div className="space-y-3">
                  {project.roles.map((r:any) => {
                    const isExpanded = expandedRoles.has(r.id);
                    const taskCount = r.tasks?.length || 0;
                    const completedCount = r.tasks?.filter((t:any) => t.done).length || 0;
                    
                    // Group tasks by milestone
                    const tasksByMilestone: Record<string, any[]> = {};
                    (r.tasks || []).forEach((t:any) => {
                      const mId = t.milestoneId || "none";
                      if (!tasksByMilestone[mId]) tasksByMilestone[mId] = [];
                      tasksByMilestone[mId].push(t);
                    });

                    return (
                      <div key={r.id} className="bg-white rounded p-3 shadow-sm border">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium text-sm">{r.title}</div>
                            <div className="text-xs text-gray-500 mt-1">{r.description}</div>
                          </div>
                          <div className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                            {completedCount}/{taskCount}
                          </div>
                        </div>

                        {/* Learning resources */}
                        {r.learning && r.learning.length > 0 && (
                          <div className="mt-2 mb-2 text-xs bg-blue-50 p-2 rounded">
                            <div className="font-semibold mb-1">📚 Learning Resources:</div>
                            {r.learning.slice(0, 2).map((l:any, i:number) => (
                              <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                                • {l.title}
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Tasks grouped by milestone */}
                        <div className="mt-2 space-y-2">
                          {Object.entries(tasksByMilestone).slice(0, isExpanded ? 999 : 1).map(([mId, tasks]) => {
                            const milestone = project.milestones?.find((m:any) => m.id === mId);
                            return (
                              <div key={mId} className="border-l-2 border-gray-200 pl-2">
                                {milestone && <div className="text-xs font-semibold text-gray-600 mb-1">{milestone.title}</div>}
                                {tasks.map((t:any) => (
                                  <div key={t.id} className="flex items-start gap-2 mb-1">
                                    <input 
                                      type="checkbox" 
                                      checked={t.done} 
                                      onChange={async (e) => {
                                        const newDone = e.target.checked;
                                        const token = getToken();
                                        try {
                                          await fetch("/api/student/project/role-task/update", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                                            body: JSON.stringify({ projectId: project._id, roleId: r.id, taskId: t.id, done: newDone })
                                          });
                                          // Optimistic update
                                          t.done = newDone;
                                          setProject({...project});
                                        } catch (err) {
                                          console.error("Task update failed", err);
                                        }
                                      }}
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <div className="text-xs">{t.title}</div>
                                      {t.description && <div className="text-xs text-gray-500">{t.description}</div>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>

                        {Object.keys(tasksByMilestone).length > 1 && (
                          <button 
                            onClick={() => toggleRoleExpand(r.id)} 
                            className="mt-2 text-xs text-indigo-600 hover:underline"
                          >
                            {isExpanded ? "Show less" : `Show all milestones (${Object.keys(tasksByMilestone).length})`}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : <div className="text-sm text-gray-500">No roles yet. They&apos;ll appear after project creation (background job).</div>}
            </div>

            {/* Milestones with progress badge */}
            <div className="bg-white rounded-xl p-4 shadow">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-semibold">Milestones</h4>
                {project.milestones && project.milestones.length > 0 && (
                  <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                    {project.milestones.filter((m:any) => m.done).length}/{project.milestones.length} done
                  </div>
                )}
              </div>
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
              <div className="flex gap-2 items-center">
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
                  } catch {
                    alert("Export failed");
                  }
                }} disabled={busy} className="px-3 py-2 border rounded">Export JSON</button>
                <button onClick={handleSubmit} disabled={busy} className="px-3 py-2 bg-green-600 text-white rounded">Submit for Review</button>
                
                {/* Zoom controls */}
                <div className="inline-flex items-center gap-1 ml-3 border rounded">
                  <button className="px-3 py-2 hover:bg-gray-50 rounded-l" onClick={zoomOut} title="Zoom Out">−</button>
                  <button className="px-3 py-2 hover:bg-gray-50 text-xs" onClick={resetZoom} title="Reset Zoom">{Math.round(zoom * 100)}%</button>
                  <button className="px-3 py-2 hover:bg-gray-50 rounded-r" onClick={zoomIn} title="Zoom In">+</button>
                </div>
              </div>
            </div>

            <Canvas nodes={viewArch.nodes} edges={viewArch.edges} />

            {/* Explanations */}
            <div className="grid grid-cols-2 gap-4 mt-4">
              {(project.steps && project.steps.length) ? project.steps.slice(Math.max(0, project.steps.length-4)).reverse().map((s:any, i:number) => (
                <div key={i} className="bg-white p-3 rounded shadow">
                  <div className="text-xs text-gray-500">Step {s.step}</div>
                  <div className="font-medium">{s.title || s.short || "Step summary"}</div>
                  <div className="text-sm text-gray-600 mt-2">
                    {(s.explanations || []).map((ex:string, idx:number) => <div key={idx} className="mb-2 text-sm">{ex}</div>)}
                  </div>

                  {/* Implementation Guide (for step 2+) */}
                  {s.implementationGuide && (s.implementationGuide.tasks?.length > 0 || s.implementationGuide.resources?.length > 0) && (
                    <div className="mt-3 p-2 bg-blue-50 border-l-2 border-blue-400 rounded">
                      <div className="text-xs font-semibold text-blue-700 mb-1">🛠️ How to implement ({project.skillLevel})</div>
                      {s.implementationGuide.tasks && s.implementationGuide.tasks.length > 0 && (
                        <ul className="text-xs text-gray-700 ml-4 mb-2 list-disc space-y-1">
                          {s.implementationGuide.tasks.map((task:string, ti:number) => (
                            <li key={ti}>{task}</li>
                          ))}
                        </ul>
                      )}
                      {s.implementationGuide.resources && s.implementationGuide.resources.length > 0 && (
                        <div className="text-xs">
                          <div className="font-semibold text-blue-600 mb-1">📚 Learning Resources:</div>
                          {s.implementationGuide.resources.slice(0, 2).map((r:any, ri:number) => (
                            <a key={ri} href={r.url} target="_blank" rel="noreferrer" className="block text-blue-600 hover:underline mb-1">
                              • {r.title}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
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
