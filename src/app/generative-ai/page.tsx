// app/generative-ai/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/authContext";
import {
  Sparkles, Brain, ArrowRight, Zap, ShoppingCart, MessageSquare,
  Store, Globe, Video, Briefcase, CheckCircle2
} from "lucide-react";

// ── App Categories ─────────────────────────────────────────────────────────

const APP_CATEGORIES = [
  {
    id: "ecommerce",
    name: "E-Commerce",
    description: "Online store, marketplace, or shopping platform",
    icon: <ShoppingCart className="w-6 h-6" />,
    examples: "Shopify, Amazon, Etsy",
    gradient: "from-amber-500 to-orange-500",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
  },
  {
    id: "social",
    name: "Social Platform",
    description: "Social network, community, or content sharing",
    icon: <MessageSquare className="w-6 h-6" />,
    examples: "Instagram, Reddit, Discord",
    gradient: "from-pink-500 to-rose-500",
    bg: "bg-pink-500/10",
    border: "border-pink-500/30",
  },
  {
    id: "marketplace",
    name: "Marketplace / On-Demand",
    description: "Two-sided platform connecting buyers & sellers",
    icon: <Store className="w-6 h-6" />,
    examples: "Swiggy, Uber, Airbnb",
    gradient: "from-emerald-500 to-teal-500",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
  },
  {
    id: "saas",
    name: "SaaS / Dashboard",
    description: "Business tool, analytics, or management platform",
    icon: <Briefcase className="w-6 h-6" />,
    examples: "Notion, Stripe Dashboard, Slack",
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
  },
  {
    id: "realtime",
    name: "Real-Time App",
    description: "Chat, collaboration, live tracking, or streaming",
    icon: <Video className="w-6 h-6" />,
    examples: "WhatsApp, Figma, Twitch",
    gradient: "from-purple-500 to-violet-500",
    bg: "bg-purple-500/10",
    border: "border-purple-500/30",
  },
  {
    id: "content",
    name: "Content Platform",
    description: "Blog, CMS, media, or educational platform",
    icon: <Globe className="w-6 h-6" />,
    examples: "Medium, YouTube, Coursera",
    gradient: "from-cyan-500 to-sky-500",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/30",
  },
];

interface RecentProject {
  _id: string;
  title: string;
  current_phase: number;
  updated_at: string;
}

export default function GenerativeAIPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

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
    if (!selectedCategory) return;

    const category = APP_CATEGORIES.find(c => c.id === selectedCategory);
    const title = projectName.trim() || `${category?.name} App`;

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
          starter_prompt: `${title} (Category: ${category?.name} — ${category?.description})`
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
      // Store category in localStorage for intake to use
      localStorage.setItem(`project-category-${data.projectId}`, selectedCategory);
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
                <span className="text-sm font-medium text-purple-400">Pro Mode</span>
              </div>

              <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-white via-purple-200 to-blue-200 bg-clip-text text-transparent">
                AI Architecture Builder
              </h1>
              <p className="text-zinc-400 text-lg mb-8">
                Pick your app type. AI designs 3 production architectures with modules, decisions, and trade-offs.
              </p>

              {/* Step 1: Category Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-300 mb-3">
                  What type of application are you building?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {APP_CATEGORIES.map((cat) => {
                    const isSelected = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        disabled={isCreating}
                        className={`relative text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer group
                          ${isSelected
                            ? `${cat.bg} ${cat.border} ring-1 ring-current scale-[1.02]`
                            : "bg-zinc-800/40 border-zinc-700/50 hover:border-zinc-600 hover:bg-zinc-800/60"
                          } disabled:opacity-50`}
                      >
                        {isSelected && (
                          <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${cat.gradient} flex items-center justify-center text-white mb-2 shadow-lg`}>
                          {cat.icon}
                        </div>
                        <h3 className="font-semibold text-white text-sm">{cat.name}</h3>
                        <p className="text-[11px] text-zinc-500 mt-0.5">{cat.description}</p>
                        <p className="text-[10px] text-zinc-600 mt-1">e.g. {cat.examples}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Project name (appears after category selection) */}
              {selectedCategory && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mb-6">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Give your project a name <span className="text-zinc-600">(optional)</span>
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleStart()}
                      placeholder={`e.g. "${APP_CATEGORIES.find(c => c.id === selectedCategory)?.examples.split(",")[0].trim()}" clone`}
                      disabled={isCreating}
                      className="flex-1 px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors disabled:opacity-50"
                    />
                    <button
                      onClick={handleStart}
                      disabled={isCreating}
                      className="px-8 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Start Building
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* How it Works */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-800/30 backdrop-blur-sm rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-400">1</div>
                    <h3 className="font-semibold text-white text-sm">Smart Intake</h3>
                  </div>
                  <p className="text-xs text-zinc-400">3 questions about scale, integrations, and priorities that drive architecture decisions.</p>
                </div>
                <div className="bg-zinc-800/30 backdrop-blur-sm rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-xs font-bold text-blue-400">2</div>
                    <h3 className="font-semibold text-white text-sm">AI Designs 3 Architectures</h3>
                  </div>
                  <p className="text-xs text-zinc-400">Monolith, service-oriented, and event-driven — each with modules, decisions, and trade-offs.</p>
                </div>
                <div className="bg-zinc-800/30 backdrop-blur-sm rounded-lg p-4 border border-zinc-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs font-bold text-emerald-400">3</div>
                    <h3 className="font-semibold text-white text-sm">Customize & Export ADR</h3>
                  </div>
                  <p className="text-xs text-zinc-400">Edit modules, swap technologies, then export a full Architecture Decision Record.</p>
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
                  <p className="text-sm">No projects yet. Pick a category above to get started!</p>
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
