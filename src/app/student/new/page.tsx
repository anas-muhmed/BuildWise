"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavHeader from "@/components/NavHeader";

/**
 * Student New Project Wizard
 * - Choose app type
 * - Choose feature checklist
 * - Choose skill level
 * - Start Project -> POST /api/student/project/create
 *
 * Notes:
 * - Expects auth token in localStorage as "token" (or change getToken)
 * - Uses the uploaded mock UI asset path (will be converted by your infra)
 */

type AppType = "ecommerce" | "notes" | "food" | "chat" | "attendance" | "task";
const APP_TYPES: { id: AppType; title: string; desc: string }[] = [
  { id: "ecommerce", title: "E-commerce", desc: "Products, cart, checkout" },
  { id: "notes", title: "Notes App", desc: "CRUD notes, tags" },
  { id: "food", title: "Food Delivery", desc: "Orders, locations" },
  { id: "chat", title: "Chat App", desc: "Real-time messaging" },
  { id: "attendance", title: "Attendance", desc: "Students, sessions" },
  { id: "task", title: "Task Manager", desc: "Tasks, projects" },
];

const FEATURE_OPTIONS: { id: string; label: string }[] = [
  { id: "auth", label: "Authentication (login/register)" },
  { id: "crud", label: "CRUD (create/read/update/delete)" },
  { id: "admin", label: "Admin Panel (basic)" },
  { id: "notifications", label: "Notifications (push/email)" },
  { id: "payments", label: "Payments (checkout)"},
  { id: "realtime", label: "Realtime (WebSocket)" },
];

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  // change this to your token key if different
  return localStorage.getItem("token");
}

function StudentNewProjectPageInner() {
  const router = useRouter();

  const [appType, setAppType] = useState<AppType>("ecommerce");
  const [skill, setSkill] = useState<"beginner"|"intermediate"|"advanced">("beginner");
  const [features, setFeatures] = useState<string[]>(["auth","crud"]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);

  function toggleFeature(id: string) {
    setFeatures(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  }

  async function handleStartProject() {
    setError(null);
    setLoading(true);

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
          // we don't send features here necessarily, features are updated using update-features route
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "Failed to create project");
      }

      const id = json?.project?._id || json?.project?.id;
      if (!id) throw new Error("Invalid response: missing project id");

      // Optionally, set features immediately by calling update-features
      // Fire-and-forget: we don't block UI on this, but we do attempt
      try {
        await fetch("/api/student/project/update-features", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ projectId: id, selectedFeatures: features }),
        });
      } catch (e) {
        console.warn("Failed to update features, continuing:", e);
      }

      setProjectId(id);
      // navigate to the editor page (adjust route if different)
      router.push(`/student/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
        {/* Left column - wizard */}
        <div className="col-span-7 bg-white rounded-xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-2">Start a Student Mode Project</h2>
          <p className="text-sm text-slate-500 mb-4">
            Guided mode for beginners — choose an app type, set skill level, pick features, and start step-by-step.
          </p>

          {/* App Type */}
          <section className="mb-6">
            <h3 className="font-medium mb-2">1) Choose app type</h3>
            <div className="grid grid-cols-2 gap-3">
              {APP_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setAppType(t.id)}
                  className={`p-3 rounded-lg text-left border transition ${
                    appType === t.id ? "border-blue-600 bg-blue-50 shadow-sm" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{t.title}</div>
                      <div className="text-xs text-slate-500">{t.desc}</div>
                    </div>
                    <div className="text-sm text-slate-400">{appType === t.id ? "✓" : ""}</div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Skill Level */}
          <section className="mb-6">
            <h3 className="font-medium mb-2">2) Skill level</h3>
            <div className="flex gap-3">
              {(["beginner","intermediate","advanced"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSkill(s)}
                  className={`px-4 py-2 rounded-lg border ${skill === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white border-gray-200"}`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Beginner: small examples. Intermediate: add services. Advanced: microservices & scaling.</p>
          </section>

          {/* Feature selector */}
          <section className="mb-6">
            <h3 className="font-medium mb-2">3) Features (optional)</h3>
            <div className="grid grid-cols-2 gap-2">
              {FEATURE_OPTIONS.map(opt => (
                <label key={opt.id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50 cursor-pointer">
                  <input checked={features.includes(opt.id)} onChange={() => toggleFeature(opt.id)} type="checkbox" />
                  <div className="text-sm">{opt.label}</div>
                </label>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-2">Select features to tailor the generated steps for learning.</p>
          </section>

          {/* Start */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartProject}
              disabled={loading}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg shadow hover:scale-[1.01] disabled:opacity-60"
            >
              {loading ? "Starting..." : "Start Project"}
            </button>

            <button
              onClick={() => {
                // show quick tutorial / open modal (simple fallback)
                alert("Tip: Start small. Generate one step at a time and review AI explanations.");
              }}
              className="px-4 py-2 border rounded text-sm"
            >
              Quick tip
            </button>

            <div className="ml-auto text-sm text-slate-500">
              {projectId ? <span>New project: <code className="bg-gray-100 px-2 py-0.5 rounded">{projectId}</code></span> : null}
            </div>
          </div>

          {error && <div className="mt-4 text-red-600">{error}</div>}
        </div>

        {/* Right column - preview + asset */}
        <div className="col-span-5">
          <div className="bg-white rounded-xl shadow p-4 mb-4">
            <h4 className="font-semibold mb-2">Student Mode preview</h4>
            <p className="text-sm text-slate-500 mb-3">
              This guided flow creates a StudentProject on the server. After creation, you will be redirected to the editor where you can generate step-by-step architecture and submit for review.
            </p>
            <div className="border rounded p-3">
              <div className="text-xs text-slate-400 mb-2">Selected</div>
              <div className="text-sm font-medium">{APP_TYPES.find(a=>a.id===appType)?.title}</div>
              <div className="text-xs text-slate-500">{skill} • {features.length} features</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-3">
            <div className="w-full h-44 bg-gradient-to-br from-blue-50 to-indigo-100 rounded flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🎓</div>
                <div className="text-sm font-medium text-slate-700">Student Mode</div>
                <div className="text-xs text-slate-500">Guided Architecture Builder</div>
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-500">UI preview placeholder</div>
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
