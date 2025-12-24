"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { Plus, BookOpen, Clock, CheckCircle, XCircle } from "lucide-react";

type Project = {
  _id: string;
  appType: string;
  skillLevel: string;
  selectedFeatures: string[];
  status: string;
  createdAt?: string;
  updatedAt?: string;
  architecture?: { nodes: unknown[]; edges: unknown[] };
};

function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export default function StudentLanding() {
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

  const getStatusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (status === "in_progress") return <Clock className="w-5 h-5 text-blue-400" />;
    return <XCircle className="w-5 h-5 text-zinc-500" />;
  };

  const getStatusColor = (status: string) => {
    if (status === "completed") return "bg-green-500/20 text-green-400";
    if (status === "in_progress") return "bg-blue-500/20 text-blue-400";
    return "bg-zinc-500/20 text-zinc-400";
  };

  return (
    <DashboardLayoutWrapper activeNav="student" breadcrumb="Student Mode">
      <div className="space-y-6">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-green-400" />
              <span className="text-sm font-medium text-green-400">
                Student Mode
              </span>
            </div>

            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              Guided Learning Projects
            </h1>
            <p className="text-zinc-400 mb-6">
              Step-by-step architecture design with AI feedback and review workflow.
            </p>

            <Link href="/student/new">
              <button className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Start New Project
              </button>
            </Link>
          </div>
        </div>

        {/* Projects List */}
        <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold">Your Projects</h2>
              <p className="text-sm text-zinc-500">Track your learning progress</p>
            </div>
            <Link href="/student/history">
              <button className="text-sm text-green-400 hover:text-green-300 transition-colors">
                View all
              </button>
            </Link>
          </div>

          <div className="space-y-3">
            {loading && (
              <div className="text-center py-8 text-zinc-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              </div>
            )}
            
            {!loading && error && (
              <div className="text-center py-8 text-red-400">
                {error}
              </div>
            )}
            
            {!loading && !error && projects.length === 0 && (
              <div className="text-center py-8 text-zinc-500">
                <p className="text-sm">No projects yet. Start your first one above!</p>
              </div>
            )}
            
            {!loading && projects.length > 0 && (
              <ul className="space-y-3">
                {projects.map((p) => (
                  <li key={p._id} className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(p.status)}
                        <div>
                          <div className="font-medium text-white">{p.appType.toUpperCase()} — {p.skillLevel}</div>
                          <div className="text-xs text-zinc-500">
                            Created: {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                        <div className="flex gap-2">
                          <Link href={`/student/${p._id}`}>
                            <button className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors text-sm">
                              Continue
                            </button>
                          </Link>
                          <Link href={`/student/${p._id}/review`}>
                            <button className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded transition-colors text-sm">
                              Review
                            </button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
            <h3 className="font-semibold mb-2 text-white">How It Works</h3>
            <ul className="text-sm text-zinc-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-400">→</span>
                <span>Generate architecture step by step</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">→</span>
                <span>Get AI feedback on each component</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">→</span>
                <span>Submit for admin review</span>
              </li>
            </ul>
          </div>

          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
            <h3 className="font-semibold mb-2 text-white">Tips</h3>
            <ul className="text-sm text-zinc-400 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Review AI suggestions carefully</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Submit only when confident</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Learn from admin feedback</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
