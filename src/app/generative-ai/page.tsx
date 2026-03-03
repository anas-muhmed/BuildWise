// app/generative-ai/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import { Sparkles, Brain, Layers, Rocket, ArrowRight, Zap } from "lucide-react";

interface RecentProject {
  _id: string;
  title: string;
  current_phase: number;
  updated_at: string;
}

export default function GenerativeAIPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [starter, setStarter] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const examples = [
    "Food delivery app like Swiggy",
    "Campus notes marketplace",
    "Real-time chat app",
    "E-commerce platform with cart",
    "Social media for photographers",
    "Fitness tracking app",
  ];

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const token = getToken();
        if (!token) return;

        const res = await fetch("/api/generative/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const recent = (data.projects || [])
            .sort((a: RecentProject, b: RecentProject) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
            .slice(0, 5);
          setRecentProjects(recent);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchProjects();
  }, [getToken]);

  const handleStart = async () => {
    if (!starter.trim()) {
      alert("Please describe what you're building");
      return;
    }

    setIsCreating(true);

    try {
      const token = getToken();

      if (!token) {
        alert("Authentication required. Please log in again.");
        router.push("/login");
        return;
      }

      const res = await fetch("/api/generative/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          starter_prompt: starter.trim()
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: "Unknown error" }));
        if (res.status === 401) {
          alert("Session expired. Please log in again.");
          router.push("/login");
          return;
        }
        throw new Error(errorData.error || "Failed to create project");
      }

      const data = await res.json();
      router.push(`/generative-ai/${data.projectId}/intake`);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to create project. Please try again.");
      setIsCreating(false);
    }
  };

  const getPhaseRoute = (project: RecentProject) => {
    if (project.current_phase <= 1) return `/generative-ai/${project._id}/intake`;
    if (project.current_phase === 2) return `/generative-ai/${project._id}/proposal`;
    return `/generative-ai/${project._id}/builder`;
  };

  return (
    <ProtectedRoute>
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder">
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-8">
            <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">
                  Pro Mode
                </span>
              </div>

              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                AI Architecture Builder
              </h1>
              <p className="text-zinc-400 text-lg mb-8">
                Describe your app. AI proposes 3 production-ready architectures. You pick, customize, and export.
              </p>

              {/* Main Input */}
              <div className="bg-zinc-800/50 backdrop-blur-sm rounded-xl border border-zinc-700 p-6 mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  What are you building?
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={starter}
                    onChange={(e) => setStarter(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleStart()}
                    placeholder="e.g., 'Food delivery app like Swiggy'..."
                    disabled={isCreating}
                    className="flex-1 px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleStart}
                    disabled={isCreating || !starter.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    {isCreating ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Generate
                      </>
                    )}
                  </button>
                </div>

                {/* Quick Examples */}
                <div className="mt-4">
                  <p className="text-xs text-zinc-500 mb-2">Try an example:</p>
                  <div className="flex flex-wrap gap-2">
                    {examples.map((ex, i) => (
                      <button
                        key={i}
                        onClick={() => setStarter(ex)}
                        disabled={isCreating}
                        className="px-3 py-1.5 text-xs bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-zinc-300"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* How it Works — 3 step cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-800/30 backdrop-blur-sm rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">1</div>
                    <h3 className="font-semibold text-white text-sm">Smart Intake</h3>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Answer 5 quick questions about users, traffic, budget, features, and priorities.
                  </p>
                </div>
                <div className="bg-zinc-800/30 backdrop-blur-sm rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">2</div>
                    <h3 className="font-semibold text-white text-sm">AI Proposes 3 Stacks</h3>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Speed-optimized, balanced, and enterprise — each with cost, trade-offs, and reasoning.
                  </p>
                </div>
                <div className="bg-zinc-800/30 backdrop-blur-sm rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">3</div>
                    <h3 className="font-semibold text-white text-sm">Customize & Export</h3>
                  </div>
                  <p className="text-xs text-zinc-400">
                    Swap any technology layer-by-layer, then export your final architecture as JSON.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Projects */}
          <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-white">Your Projects</h2>
                <p className="text-sm text-zinc-500">Continue where you left off</p>
              </div>
            </div>

            <div className="space-y-3">
              {loadingProjects ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">
                  <Zap className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                  <p className="text-sm">No projects yet. Describe your app above to get started!</p>
                </div>
              ) : (
                recentProjects.map((project) => (
                  <div
                    key={project._id}
                    onClick={() => router.push(getPhaseRoute(project))}
                    className="p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-purple-500/50 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                          <Brain className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                          <div className="font-medium text-white group-hover:text-purple-400 transition-colors">
                            {project.title}
                          </div>
                          <div className="text-xs text-zinc-500">
                            {project.current_phase <= 1 ? "Intake" : project.current_phase === 2 ? "Proposal" : "Builder"} • {new Date(project.updated_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardLayoutWrapper>
    </ProtectedRoute>
  );
}
