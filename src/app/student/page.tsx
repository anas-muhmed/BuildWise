"use client";
import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import NavHeader from "@/components/NavHeader";

/**
 * Student Landing / Dashboard
 * - Lists StudentProjects for current user
 * - Shows statuses and quick actions (Continue / Submit / Create)
 * - Uses GET /api/student/projects (create this route if missing)
 *
 * Requires token in localStorage under "token".
 */

type Project = {
  _id: string;
  appType: string;
  skillLevel: string;
  selectedFeatures: string[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  architecture?: { nodes: any[]; edges: any[] };
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function StudentLanding() {
  return (
    <ProtectedRoute>
      <NavHeader />
      <StudentLandingContent />
    </ProtectedRoute>
  );
}

function StudentLandingContent() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadProjects() {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch("/api/student/projects", {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.error || "Failed");
      setProjects(j.projects || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Student Mode</h1>
            <p className="text-sm text-slate-500">Your guided projects — draft, generate, submit.</p>
          </div>
          <div className="flex gap-2">
            <a href="/student/new">
              <button className="px-4 py-2 bg-blue-600 text-white rounded">Start New Project</button>
            </a>
            <a href="/student/history">
              <button className="px-4 py-2 border rounded">My Projects</button>
            </a>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <div className="bg-white rounded-xl p-4 shadow">
              <h3 className="font-semibold mb-3">Recent Projects</h3>
              {loading && <div className="text-sm text-gray-500">Loading...</div>}
              {!loading && error && <div className="text-red-600">{error}</div>}
              {!loading && !error && projects.length === 0 && (
                <div className="text-sm text-gray-500">No projects yet. Click Start New Project.</div>
              )}
              {!loading && projects.length > 0 && (
                <ul className="space-y-3">
                  {projects.map((p) => (
                    <li key={p._id} className="p-3 border rounded flex justify-between items-center">
                      <div>
                        <div className="font-medium">{p.appType.toUpperCase()} — {p.skillLevel}</div>
                        <div className="text-xs text-gray-500">Status: <span className="font-semibold">{p.status}</span> • Created: {p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}</div>
                      </div>
                      <div className="flex gap-2">
                        <a href={`/student/${p._id}`}>
                          <button className="px-3 py-1 border rounded">Continue</button>
                        </a>
                        <a href={`/student/${p._id}/review`}>
                          <button className="px-3 py-1 bg-indigo-600 text-white rounded">Review</button>
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="col-span-4">
            <div className="bg-white rounded-xl p-4 shadow mb-4">
              <h4 className="font-semibold mb-2">Student Mode Preview</h4>
              <p className="text-sm text-slate-500 mb-3">Guided steps, simple explanations, AI feedback and admin review workflow.</p>
              <div className="w-full h-36 bg-gradient-to-br from-blue-50 to-indigo-100 rounded flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎓</div>
                  <div className="text-sm font-medium text-slate-700">Student Mode</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow">
              <h4 className="font-semibold mb-2">Tips</h4>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>Generate one step at a time.</li>
                <li>Review AI suggestions before submitting.</li>
                <li>Submit only when ready — admin (you) will review.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
