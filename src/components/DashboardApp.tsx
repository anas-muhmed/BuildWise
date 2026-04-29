"use client";

import React, { useState, useEffect } from "react";
import {
  BookOpen, History, Trophy, Settings,
  Sparkles, Search, Bell, Command,
  Cpu, Zap, Share2, ArrowUpRight, ArrowRight,
  Layers, Brain,
} from "lucide-react";

interface RecentProject {
  _id: string;
  title: string;
  current_phase: number;
  updated_at: string;
}

export default function DashboardApp() {
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) { setLoadingProjects(false); return; }

        const response = await fetch("/api/generative/projects", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const recent = (data.projects || [])
            .sort((a: RecentProject, b: RecentProject) =>
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
            .slice(0, 5);
          setRecentProjects(recent);
        }
      } catch (error) {
        console.error("Error fetching recent projects:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    fetchRecentProjects();
  }, []);

  const getPhaseLabel = (phase: number) => {
    if (phase <= 1) return "Intake";
    if (phase === 2) return "Proposal";
    return "Builder";
  };

  const getPhaseRoute = (project: RecentProject) => {
    if (project.current_phase <= 1) return `/generative-ai/${project._id}/intake`;
    if (project.current_phase === 2) return `/generative-ai/${project._id}/proposal`;
    return `/generative-ai/${project._id}/builder`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 flex flex-col">
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">BuildWise</span>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-1">
          <NavItem icon={<Layers />} label="Dashboard" active />
          <NavItem
            icon={<BookOpen />}
            label="Student Mode"
            onClick={() => window.location.href = "/student"}
          />
          <NavItem
            icon={<Brain />}
            label="Pro Mode"
            onClick={() => window.location.href = "/generative-ai"}
          />
          <NavItem
            icon={<History />}
            label="Recent Work"
            onClick={() => window.location.href = "/generative-ai"}
          />
          <NavItem
            icon={<Trophy />}
            label="Leaderboard"
            onClick={() => alert("Leaderboard coming soon!")}
          />
        </div>

        <div className="p-4 border-t border-zinc-800 space-y-4">
          <NavItem icon={<Settings />} label="Settings" />
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">User</div>
              <div className="text-xs text-zinc-500">Student</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-16 border-b border-zinc-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>Workspace</span>
            <span>/</span>
            <span className="text-white">Dashboard</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-12 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-700"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-zinc-600">
                <Command className="w-3 h-3" />
                <span>K</span>
              </div>
            </div>
            <button className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
              <Bell className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Welcome Header */}
            <div>
              <h1 className="text-3xl font-bold mb-1">Welcome to BuildWise</h1>
              <p className="text-zinc-500">Choose a mode to start designing system architectures</p>
            </div>

            {/* Two Mode Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Mode Card */}
              <div
                onClick={() => {
                  const projectId = Date.now().toString();
                  window.location.href = `/student-mode/${projectId}/setup`;
                }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-8 hover:border-green-500/40 transition-all cursor-pointer group"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-green-500/5 rounded-full blur-3xl group-hover:bg-green-500/10 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-green-400 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/30">Learning</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Student Mode</h2>
                  <p className="text-sm text-zinc-400 mb-4">
                    Learn system design step-by-step. Make decisions, get scored, defend your architecture with a team.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-green-400 group-hover:gap-3 transition-all">
                    <span>Start Learning</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Pro Mode Card */}
              <div
                onClick={() => window.location.href = "/generative-ai"}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-8 hover:border-purple-500/40 transition-all cursor-pointer group"
              >
                <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl group-hover:bg-purple-500/10 transition-all"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                      <Brain className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs font-medium text-purple-400 px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30">Pro</span>
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Pro Mode</h2>
                  <p className="text-sm text-zinc-400 mb-4">
                    AI generates 3 production-ready architectures. Pick one, customize stack layer-by-layer, export.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-purple-400 group-hover:gap-3 transition-all">
                    <span>Build Architecture</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Projects */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">Recent Projects</h2>
                  <p className="text-sm text-zinc-500">Continue where you left off</p>
                </div>
                <button
                  onClick={() => window.location.href = "/generative-ai"}
                  className="text-sm text-purple-400 hover:text-purple-300 transition-colors cursor-pointer"
                >
                  View all
                </button>
              </div>

              <div className="space-y-2">
                {loadingProjects ? (
                  <div className="text-center py-8 text-zinc-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  </div>
                ) : recentProjects.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <Sparkles className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
                    <p className="text-sm">No projects yet. Pick a mode above to get started!</p>
                  </div>
                ) : (
                  recentProjects.map((project) => (
                    <div
                      key={project._id}
                      onClick={() => window.location.href = getPhaseRoute(project)}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-purple-500/40 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400">
                          <Brain className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white group-hover:text-purple-400 transition-colors">{project.title}</div>
                          <div className="text-xs text-zinc-500">{getPhaseLabel(project.current_phase)} • {getTimeAgo(project.updated_at)}</div>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-purple-400 transition-colors" />
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ── NavItem ────────────────────────────────────────────────────────────────

function NavItem({ icon, label, active, onClick }: {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all ${active
          ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white"
          : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
        }`}
    >
      <div className="w-5 h-5">{icon}</div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}
