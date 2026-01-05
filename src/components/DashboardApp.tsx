"use client";

import React, { useState } from "react";
import {
  LayoutGrid,
  BookOpen,
  History,
  Trophy,
  Settings,
  Plus,
  Sparkles,
  Search,
  Bell,
  Command,
  Cpu,
  Share2,

  ArrowUpRight,
  Zap,
  Box,
  Layers,
  Activity,
} from "lucide-react";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem = ({ icon, label, active, onClick }: NavItemProps) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all ${
      active
        ? "bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-white"
        : "text-zinc-400 hover:text-white hover:bg-zinc-800/50"
    }`}
  >
    <div className="w-5 h-5">{icon}</div>
    <span className="text-sm font-medium">{label}</span>
  </div>
);

interface ListItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  action: string;
  onClick?: () => void;
}

const ListItem = ({ icon, title, subtitle, action, onClick }: ListItemProps) => (
  <div 
    onClick={onClick}
    className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-600 transition-all cursor-pointer group"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400">
        {icon}
      </div>
      <div>
        <div className="text-sm font-medium text-white">{title}</div>
        <div className="text-xs text-zinc-500">{subtitle}</div>
      </div>
    </div>
    <div className="flex items-center gap-2 text-xs text-zinc-500 group-hover:text-purple-400 transition-colors">
      <span>{action}</span>
      <ArrowUpRight className="w-4 h-4" />
    </div>
  </div>
);

interface RecentProject {
  _id: string;
  title: string;
  current_phase: number;
  updated_at: string;
}

export default function DashboardApp() {
  const [generativeInput, setGenerativeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Fetch recent projects on mount
  React.useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const response = await fetch("/api/generative/projects", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Get last 3 projects sorted by updated_at
          const recent = (data.projects || [])
            .sort((a: RecentProject, b: RecentProject) => 
              new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
            )
            .slice(0, 3);
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

  const handleNewProject = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/generative/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          starter_prompt: "Manual design project",
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/generative-ai-v2/${data.projectId}/intake`;
      } else {
        alert("Failed to create project. Please try again.");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerativeDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!generativeInput.trim()) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch("/api/generative/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          starter_prompt: generativeInput,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        window.location.href = `/generative-ai-v2/${data.projectId}/intake`;
      } else {
        alert("Failed to create project. Please try again.");
      }
    } catch (error) {
      console.error("Error creating project:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 border-r border-zinc-800 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">BuildWise</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 p-4 space-y-1">
          <NavItem icon={<LayoutGrid />} label="Workspace" active />
          <NavItem 
            icon={<BookOpen />} 
            label="Student Mode" 
            onClick={() => window.location.href = "/student"}
          />
          <NavItem 
            icon={<History />} 
            label="Recent Work" 
            onClick={() => window.location.href = "/generative-ai-v2"}
          />
          <NavItem 
            icon={<Trophy />} 
            label="Leaderboard" 
            onClick={() => alert("Leaderboard coming soon!")}
          />
        </div>

        {/* Settings & User */}
        <div className="p-4 border-t border-zinc-800 space-y-4">
          <NavItem icon={<Settings />} label="Settings" />
          <div className="flex items-center gap-3 px-4 py-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">Safia</div>
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
            {/* Search */}
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

            {/* Notifications */}
            <button className="w-9 h-9 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors">
              <Bell className="w-4 h-4 text-zinc-400" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Hero Section */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-8">
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">
                    Generative Design v2.0
                  </span>
                </div>

                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  Transform Ideas Into Architecture
                </h1>
                <p className="text-zinc-400 mb-6">
                  Describe your vision, and let AI craft the perfect system
                  design.
                </p>

                <form
                  onSubmit={handleGenerativeDesign}
                  className="flex gap-3 mb-4"
                >
                  <input
                    type="text"
                    placeholder="e.g., 'Build a real-time food delivery platform...'"
                    value={generativeInput}
                    onChange={(e) => setGenerativeInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-zinc-900/50 border border-zinc-800 rounded-lg text-sm focus:outline-none focus:border-zinc-700 backdrop-blur-sm"
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg font-medium text-sm hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    {loading ? "Creating..." : "Generate"}
                  </button>
                </form>

                <button
                  onClick={handleNewProject}
                  disabled={loading}
                  className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Or start with manual design
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Student Mode Card */}
              <div 
                onClick={() => {
                  const projectId = Date.now().toString();
                  window.location.href = `/student-mode/${projectId}/setup`;
                }}
                className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-xs text-zinc-500">Active</span>
                </div>
                <div className="text-2xl font-bold mb-1">Student Mode</div>
                <div className="text-xs text-zinc-500 mb-3">
                  Learning in progress
                </div>
                <div className="w-full bg-zinc-800 rounded-full h-2">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full w-3/4"></div>
                </div>
                <div className="text-xs text-zinc-500 mt-2">75% Complete</div>
              </div>

              {/* Manual Design Card */}
              <div 
                onClick={() => window.location.href = "/design"}
                className="rounded-xl bg-zinc-900 border border-zinc-800 p-6 hover:border-zinc-700 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Box className="w-5 h-5 text-blue-400" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-500" />
                </div>
                <div className="text-2xl font-bold mb-1">{recentProjects.length}</div>
                <div className="text-sm text-zinc-400">Manual Design</div>
                <div className="text-xs text-zinc-600 mt-2">
                  Classic builder mode
                </div>
              </div>

              {/* Reputation Card */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-xs text-green-400 flex items-center gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +12%
                  </span>
                </div>
                <div className="text-2xl font-bold mb-1">1,240</div>
                <div className="text-sm text-zinc-400">Reputation Score</div>
                <div className="text-xs text-zinc-600 mt-2">Top 15% rank</div>
              </div>

              {/* System Status Card */}
              <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-orange-400" />
                  </div>
                  <span className="text-xs text-green-400">●</span>
                </div>
                <div className="text-2xl font-bold mb-1">All Systems</div>
                <div className="text-sm text-zinc-400">Operational</div>
                <div className="text-xs text-zinc-600 mt-2">
                  99.9% uptime
                </div>
              </div>
            </div>

            {/* Recent Blueprints */}
            <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold">Recent Blueprints</h2>
                  <p className="text-sm text-zinc-500">
                    Your latest architecture designs
                  </p>
                </div>
                <button className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
                  View all
                </button>
              </div>

              <div className="space-y-3">
                {loadingProjects ? (
                  <div className="text-center py-8 text-zinc-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                  </div>
                ) : recentProjects.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <p className="text-sm">No projects yet. Create your first one above!</p>
                  </div>
                ) : (
                  recentProjects.map((project) => {
                    const getPhaseIcon = (phase: number) => {
                      if (phase === 1) return <Cpu />;
                      if (phase === 2) return <Zap />;
                      return <Share2 />;
                    };

                    const getTimeAgo = (dateString: string) => {
                      const date = new Date(dateString);
                      const now = new Date();
                      const diff = now.getTime() - date.getTime();
                      const hours = Math.floor(diff / (1000 * 60 * 60));
                      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                      
                      if (hours < 1) return "Just now";
                      if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
                      if (days === 1) return "Yesterday";
                      if (days < 7) return `${days} days ago`;
                      return date.toLocaleDateString();
                    };

                    const getPhaseRoute = (project: RecentProject) => {
                      if (project.current_phase === 1) return `/generative-ai-v2/${project._id}/intake`;
                      if (project.current_phase === 2) return `/generative-ai-v2/${project._id}/proposal`;
                      return `/generative-ai-v2/${project._id}/builder`;
                    };

                    return (
                      <ListItem
                        key={project._id}
                        icon={getPhaseIcon(project.current_phase)}
                        title={project.title}
                        subtitle={getTimeAgo(project.updated_at)}
                        action={project.current_phase === 3 ? "Continue" : "View"}
                        onClick={() => window.location.href = getPhaseRoute(project)}
                      />
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
