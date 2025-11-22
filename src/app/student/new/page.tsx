// src/app/student/new/page.tsx
"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavHeader from "@/components/NavHeader";

const APP_TYPES = [
  { id: "ecommerce", title: "E-commerce", desc: "Products, cart, checkout" },
  { id: "notes", title: "Notes App", desc: "CRUD notes, tags" },
  { id: "food", title: "Food Delivery", desc: "Orders, locations" },
  { id: "chat", title: "Chat App", desc: "Real-time messaging" },
  { id: "attendance", title: "Attendance", desc: "Students, sessions" },
  { id: "task", title: "Task Manager", desc: "Tasks, projects" },
];

const FEATURE_OPTIONS = [
  { id: "auth", label: "Authentication (login/register)" },
  { id: "crud", label: "CRUD (create/read/update/delete)" },
  { id: "admin", label: "Admin Panel (basic)" },
  { id: "notifications", label: "Notifications (push/email)" },
  { id: "search", label: "Search & Filters" },
  { id: "payments", label: "Payment Integration" },
];

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

function StudentNewProjectPageInner() {
  const router = useRouter();

  // --- Phase UI state
  const [phase, setPhase] = useState<number>(1); // 1 = Goal Setup
  // form state
  const [appType, setAppType] = useState("ecommerce");
  const [skill, setSkill] = useState<"beginner"|"intermediate"|"advanced">("beginner");
  const [features, setFeatures] = useState<string[]>(["auth","crud"]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [purpose, setPurpose] = useState("");
  const [constraints, setConstraints] = useState<string[]>([]);
  const [learningGoals, setLearningGoals] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleFeature(fid: string) {
    setFeatures(prev => prev.includes(fid) ? prev.filter(x=>x!==fid) : [...prev, fid]);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function addTag(setter: (s:any)=>void, value: string) {
    const v = value.trim();
    if (!v) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setter((prev:any) => Array.from(new Set([...prev, v])));
  }

  async function handleCreate() {
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const res = await fetch("/api/student/project/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          appType,
          skillLevel: skill,
          // extra metadata — backend may ignore unknown fields safely
          meta: { purpose, constraints, learningGoals }
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to create");
      const pid = json.project?._id;
      if (!pid) throw new Error("No project ID returned");
      setProjectId(pid);

      // update features
      await fetch("/api/student/project/update-features", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ projectId: pid, selectedFeatures: features }),
      });

      // generate roles immediately (best-effort)
      try {
        await fetch("/api/student/project/generate-roles", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ projectId: pid }),
        });
      } catch (e) {
        console.error("generate-roles failed", e);
      }

      // redirect to editor
      router.push(`/student/${pid}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        {/* Left: Steps */}
        <div className="col-span-3">
          <div className="bg-white rounded-xl p-4 shadow">
            <h4 className="font-semibold mb-3">Steps</h4>
            <ol className="text-sm space-y-2">
              <li className={`p-2 rounded ${phase===1 ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>1. Goal Setup</li>
              <li className={`p-2 rounded ${phase===2 ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>2. Feature Planning</li>
              <li className={`p-2 rounded ${phase===3 ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>3. Architecture</li>
              <li className={`p-2 rounded ${phase===4 ? "bg-blue-50 border-l-4 border-blue-600" : ""}`}>4. Submit & Review</li>
            </ol>
            <div className="mt-4 text-xs text-gray-500">Progress: {Math.round((phase-1)/3*100)}%</div>
          </div>
        </div>

        {/* Center: Goal Setup Form */}
        <div className="col-span-7">
          <div className="bg-white rounded-xl p-6 shadow mb-6">
            <h1 className="text-2xl font-semibold mb-2">Start a Student Mode Project</h1>
            <p className="text-sm text-gray-500 mb-4">Phase 1 — Goal Setup. Describe the purpose and constraints so BuildWise tailors the learning path.</p>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">1) Choose app type</label>
              <div className="grid grid-cols-2 gap-3">
                {APP_TYPES.map(a=>(
                  <button key={a.id} onClick={()=>setAppType(a.id)} className={`p-4 border rounded-lg text-left ${appType===a.id ? "border-blue-600 bg-blue-50" : "border-gray-200"}`}>
                    <div className="font-semibold">{a.title}</div>
                    <div className="text-xs text-gray-500">{a.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">2) Skill level</label>
              <div className="flex gap-3">
                {(["beginner","intermediate","advanced"] as const).map(l => (
                  <button key={l} onClick={()=>setSkill(l)} className={`px-4 py-2 rounded ${skill===l ? "bg-indigo-600 text-white" : "bg-white border"}`}>
                    <div className="capitalize">{l}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">3) Purpose (one line)</label>
              <input value={purpose} onChange={e=>setPurpose(e.target.value)} className="w-full p-3 border rounded" placeholder="Why are you building this? (e.g. learning backend concepts)" />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">4) Constraints (add tags)</label>
              <div className="flex gap-2 mb-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <input id="constraint" className="flex-1 p-2 border rounded" placeholder="eg. low budget, offline-first" onKeyDown={(e:any) => {
                  if (e.key === "Enter") { e.preventDefault(); addTag(setConstraints, e.target.value); e.target.value=""; }
                }} />
                <div className="text-xs text-gray-500">Press Enter to add</div>
              </div>
              <div className="flex gap-2 flex-wrap">
                {constraints.map((c,i)=> <div key={i} className="px-3 py-1 bg-gray-100 rounded text-sm">{c}</div>)}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">5) Learning goals (add tags)</label>
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <input id="goal" className="w-full p-2 border rounded" placeholder="eg. learn auth, learn DB design" onKeyDown={(e:any) => {
                if (e.key === "Enter") { e.preventDefault(); addTag(setLearningGoals, e.target.value); e.target.value=""; }
              }} />
              <div className="flex gap-2 flex-wrap mt-2">
                {learningGoals.map((g,i)=> <div key={i} className="px-3 py-1 bg-green-50 rounded text-sm">{g}</div>)}
              </div>
            </div>

            {error && <div className="mb-4 text-red-600">{error}</div>}

            <div className="flex gap-3 mt-4">
              <button onClick={() => setPhase(2)} className="px-4 py-2 border rounded">
                Next: Feature Planning →
              </button>
            </div>
          </div>

          {/* ==================== PHASE 2 — FEATURE PLANNING ==================== */}
          {phase === 2 && (
            <div className="bg-white rounded-xl p-6 shadow mb-6 mt-6">
              <h1 className="text-xl font-semibold mb-2">Phase 2 — Feature Planning</h1>
              <p className="text-sm text-gray-500 mb-4">
                Select the features you want. BuildWise will adjust your learning path, roles, and architecture.
              </p>

              {/* Recommended Features */}
              <div className="mb-6">
                <h3 className="font-medium mb-2">Recommended for {appType}</h3>
                <p className="text-xs text-gray-500 mb-3">Based on typical {appType} architecture.</p>

                <div className="flex gap-2 flex-wrap">
                  {FEATURE_OPTIONS.map((fo) => (
                    <button
                      key={fo.id}
                      onClick={() => toggleFeature(fo.id)}
                      className={`px-3 py-2 rounded border text-sm ${
                        features.includes(fo.id)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {fo.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skill Level Impact */}
              <div className="mb-6 bg-gray-50 border p-4 rounded">
                <h3 className="font-medium mb-2">Skill Level Impact</h3>
                <ul className="text-sm space-y-2">
                  {skill === "beginner" && (
                    <>
                      <li>✔ 3-tier architecture (frontend → backend → DB)</li>
                      <li>✔ Simple CRUD operations</li>
                      <li>✔ Basic authentication</li>
                      <li className="text-gray-500">✖ No microservices</li>
                    </>
                  )}

                  {skill === "intermediate" && (
                    <>
                      <li>✔ API Gateway + services</li>
                      <li>✔ Add caching or notifications</li>
                      <li>✔ Payments allowed</li>
                    </>
                  )}

                  {skill === "advanced" && (
                    <>
                      <li>✔ Microservices, load balancer</li>
                      <li>✔ Redis cache + message queues</li>
                      <li>✔ Scalable DB clusters</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Live Role Preview */}
              <div className="mb-6 bg-gray-50 p-4 rounded border">
                <h3 className="font-medium mb-3">Live Role Preview</h3>
                <p className="text-xs text-gray-500 mb-3">Create project first, then update roles based on selected features.</p>

                <button
                  onClick={async () => {
                    if (!projectId) {
                      alert("Create project first by going to Phase 3");
                      return;
                    }
                    const token = getToken();
                    await fetch("/api/student/project/generate-roles", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({ projectId }),
                    });
                    alert("Roles updated. Continue to architecture.");
                  }}
                  disabled={!projectId}
                  className="px-4 py-2 bg-blue-600 text-white rounded mb-3 disabled:opacity-50"
                >
                  Update Roles
                </button>

                <div className="text-xs text-gray-600">
                  Roles will be visible on the editor sidebar (Backend, Frontend, Cloud, Docs).
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex gap-3">
                <button onClick={() => setPhase(1)} className="px-4 py-2 border rounded">
                  Back
                </button>
                <button onClick={() => setPhase(3)} className="px-4 py-2 bg-blue-600 text-white rounded">
                  Continue to Architecture →
                </button>
              </div>
            </div>
          )}

          {/* ==================== PHASE 3 — CREATE PROJECT ==================== */}
          {phase === 3 && (
            <div className="bg-white rounded-xl p-6 shadow mb-6 mt-6">
              <h1 className="text-xl font-semibold mb-2">Phase 3 — Ready to Start</h1>
              <p className="text-sm text-gray-500 mb-4">
                Review your selections and create the project. You&apos;ll be redirected to the architecture editor.
              </p>

              <div className="mb-4 bg-gray-50 p-4 rounded">
                <div className="text-sm space-y-2">
                  <p><strong>App Type:</strong> {APP_TYPES.find(a=>a.id===appType)?.title}</p>
                  <p><strong>Skill Level:</strong> {skill}</p>
                  <p><strong>Features:</strong> {features.join(", ")}</p>
                  <p><strong>Purpose:</strong> {purpose || "Not specified"}</p>
                </div>
              </div>

              {error && <div className="mb-4 text-red-600">{error}</div>}

              <div className="flex gap-3">
                <button onClick={() => setPhase(2)} className="px-4 py-2 border rounded">
                  Back
                </button>
                <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded">
                  {loading ? "Creating..." : "Create Project & Start Editor"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Explanation / AI-like response */}
        <div className="col-span-2">
          <div className="bg-white rounded-xl p-4 shadow mb-4">
            <h4 className="font-semibold mb-2">Quick Overview</h4>
            <div className="text-sm text-gray-600">
              <p><strong>App:</strong> {APP_TYPES.find(a=>a.id===appType)?.title}</p>
              <p><strong>Skill:</strong> {skill}</p>
              <p className="mt-2">Based on your choices: Start small. Implement Auth + CRUD. Avoid direct DB access from UI. We&apos;ll provide a 3-step architecture and role tasks.</p>
            </div>
          </div>

          <div className="bg-white rounded-xl p-4 shadow">
            <h4 className="font-semibold mb-2">Tips</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>Generate one step at a time in the editor.</li>
              <li>Use roles to split work among teammates.</li>
              <li>Submit only when roles & milestones are present.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function StudentNewProjectPage() {
  return (
    <ProtectedRoute>
      <NavHeader />
      <StudentNewProjectPageInner />
    </ProtectedRoute>
  );
}
