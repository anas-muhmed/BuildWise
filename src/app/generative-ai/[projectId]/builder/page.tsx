"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  ArrowLeft, ArrowRight, CheckCircle2, RefreshCw, Layers,
  Monitor, Server, Database, Cloud, ChevronDown, ChevronUp, Sparkles
} from "lucide-react";

// ── Technology alternatives for each layer ─────────────────────────────────

interface TechAlt {
  name: string;
  description: string;
  pros: string[];
  fit: "great" | "good" | "okay";
}

const ALTERNATIVES: Record<string, TechAlt[]> = {
  frontend: [
    { name: "Next.js + Tailwind CSS", description: "Full-stack React framework with built-in SSR, routing, and API routes", pros: ["SSR/SSG", "File routing", "Edge functions"], fit: "great" },
    { name: "React + Vite + Tailwind", description: "Lightweight SPA with blazing fast dev server", pros: ["Fast builds", "Full control", "Lightweight"], fit: "great" },
    { name: "Vue 3 + Nuxt", description: "Progressive framework with great DX and SSR", pros: ["Easy to learn", "Composition API", "SSR built-in"], fit: "good" },
    { name: "Angular + Material UI", description: "Enterprise-grade framework with opinionated structure", pros: ["TypeScript native", "Enterprise patterns", "CLI tools"], fit: "good" },
    { name: "Svelte + SvelteKit", description: "Compile-time framework, zero runtime overhead", pros: ["Smallest bundle", "No virtual DOM", "Fast"], fit: "okay" },
  ],
  backend: [
    { name: "Next.js API Routes + Prisma", description: "Serverless functions co-located with frontend", pros: ["Zero config", "Type-safe DB", "Serverless"], fit: "great" },
    { name: "Node.js + Express + TypeScript", description: "Industry standard, huge ecosystem", pros: ["Battle-tested", "Easy hiring", "Flexible"], fit: "great" },
    { name: "Python + FastAPI", description: "Modern Python async framework with auto-docs", pros: ["Auto OpenAPI", "Async native", "ML-ready"], fit: "good" },
    { name: "Go + Gin", description: "High-performance compiled language", pros: ["Fastest runtime", "Low memory", "Concurrency"], fit: "good" },
    { name: "Java + Spring Boot", description: "Enterprise-grade with massive ecosystem", pros: ["Enterprise standard", "JVM ecosystem", "Microservices"], fit: "okay" },
  ],
  database: [
    { name: "PostgreSQL (Supabase)", description: "Managed Postgres with auth, realtime & storage", pros: ["Managed", "Built-in auth", "Realtime"], fit: "great" },
    { name: "PostgreSQL + Redis", description: "Relational DB with in-memory cache", pros: ["ACID compliance", "Complex queries", "Caching"], fit: "great" },
    { name: "MongoDB Atlas + Redis", description: "Flexible document DB with caching layer", pros: ["Schema-less", "Horizontal scaling", "JSON native"], fit: "good" },
    { name: "MySQL + Memcached", description: "Classic relational DB with mature caching", pros: ["Widely supported", "Proven at scale", "Simple"], fit: "good" },
    { name: "DynamoDB + ElastiCache", description: "AWS native serverless NoSQL", pros: ["Serverless", "Auto-scaling", "AWS integrated"], fit: "okay" },
  ],
  hosting: [
    { name: "Vercel", description: "Zero-config deployment with edge network", pros: ["Auto HTTPS", "Edge CDN", "Git deploy"], fit: "great" },
    { name: "AWS (ECS Fargate)", description: "Scalable containers without managing servers", pros: ["Auto-scaling", "No server mgmt", "AWS ecosystem"], fit: "great" },
    { name: "Railway", description: "Modern PaaS — deploy from GitHub in seconds", pros: ["Simple pricing", "Git deploy", "Managed DBs"], fit: "good" },
    { name: "DigitalOcean App Platform", description: "Developer-friendly cloud at fair prices", pros: ["Predictable pricing", "Simple UI", "Good docs"], fit: "good" },
    { name: "Kubernetes (EKS/GKE)", description: "Full orchestration for large-scale apps", pros: ["Max control", "Self-healing", "Multi-cloud"], fit: "okay" },
  ]
};

const LAYER_ICONS: Record<string, React.ReactNode> = {
  frontend: <Monitor className="w-5 h-5 text-blue-400" />,
  backend: <Server className="w-5 h-5 text-purple-400" />,
  database: <Database className="w-5 h-5 text-emerald-400" />,
  hosting: <Cloud className="w-5 h-5 text-amber-400" />,
};

const LAYER_COLORS: Record<string, { bg: string; border: string; accent: string }> = {
  frontend: { bg: "bg-blue-500/10", border: "border-blue-500/30", accent: "text-blue-400" },
  backend: { bg: "bg-purple-500/10", border: "border-purple-500/30", accent: "text-purple-400" },
  database: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", accent: "text-emerald-400" },
  hosting: { bg: "bg-amber-500/10", border: "border-amber-500/30", accent: "text-amber-400" },
};

const FIT_LABELS: Record<string, { bg: string; text: string; label: string }> = {
  great: { bg: "bg-green-500/20", text: "text-green-400", label: "Best Fit" },
  good: { bg: "bg-blue-500/20", text: "text-blue-400", label: "Good Fit" },
  okay: { bg: "bg-zinc-700/50", text: "text-zinc-400", label: "Viable" },
};

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [proposal, setProposal] = useState<any>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [expandedLayer, setExpandedLayer] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load the selected proposal
  useEffect(() => {
    const stored = localStorage.getItem(`proposal-${projectId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setProposal(parsed);
      // Initialize selections from proposal
      setSelections({
        frontend: parsed.layers.frontend.tech,
        backend: parsed.layers.backend.tech,
        database: parsed.layers.database.tech,
        hosting: parsed.layers.hosting.tech,
      });
    }
  }, [projectId]);

  // Count changes from original proposal
  const changeCount = useMemo(() => {
    if (!proposal) return 0;
    let count = 0;
    if (selections.frontend !== proposal.layers.frontend.tech) count++;
    if (selections.backend !== proposal.layers.backend.tech) count++;
    if (selections.database !== proposal.layers.database.tech) count++;
    if (selections.hosting !== proposal.layers.hosting.tech) count++;
    return count;
  }, [selections, proposal]);

  if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  if (!proposal) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Customize Stack">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">No proposal selected. Pick an architecture first.</p>
            <button onClick={() => router.push(`/generative-ai/${projectId}/proposal`)} className="px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer">
              Go to Proposals
            </button>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  const handleSwap = (layer: string, tech: string) => {
    setSelections(prev => ({ ...prev, [layer]: tech }));
    setExpandedLayer(null);
  };

  const handleFinalize = async () => {
    setIsSaving(true);
    // Save final stack to localStorage for finalize page
    const finalStack = {
      ...proposal,
      layers: {
        frontend: { tech: selections.frontend, reason: ALTERNATIVES.frontend.find(a => a.name === selections.frontend)?.description || "" },
        backend: { tech: selections.backend, reason: ALTERNATIVES.backend.find(a => a.name === selections.backend)?.description || "" },
        database: { tech: selections.database, reason: ALTERNATIVES.database.find(a => a.name === selections.database)?.description || "" },
        hosting: { tech: selections.hosting, reason: ALTERNATIVES.hosting.find(a => a.name === selections.hosting)?.description || "" },
        extras: proposal.layers.extras,
      },
      customized: true,
      changesFromOriginal: changeCount,
    };
    localStorage.setItem(`finalstack-${projectId}`, JSON.stringify(finalStack));

    // Redirect to finalize
    setTimeout(() => {
      router.push(`/generative-ai/${projectId}/finalize`);
    }, 800);
  };

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Customize Stack">
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push(`/generative-ai/${projectId}/proposal`)}
              className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-400" />
                Customize Your Stack
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Starting from <span className="text-purple-400 font-medium">{proposal.name}</span> — swap any layer below
              </p>
            </div>
          </div>

          {/* Changes indicator */}
          {changeCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
              <RefreshCw className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-300 font-medium">{changeCount} layer{changeCount > 1 ? "s" : ""} customized</span>
            </div>
          )}
        </div>

        {/* Layer Cards */}
        <div className="space-y-4">
          {(["frontend", "backend", "database", "hosting"] as const).map((layer) => {
            const isExpanded = expandedLayer === layer;
            const currentTech = selections[layer];
            const colors = LAYER_COLORS[layer];
            const isChanged = currentTech !== proposal.layers[layer].tech;
            const currentAlt = ALTERNATIVES[layer].find(a => a.name === currentTech);

            return (
              <div key={layer} className={`rounded-2xl border transition-all duration-300 ${isExpanded ? `${colors.border} ${colors.bg}` : "border-zinc-800 bg-zinc-900/50"}`}>
                {/* Layer Header */}
                <button
                  onClick={() => setExpandedLayer(isExpanded ? null : layer)}
                  className="w-full flex items-center justify-between p-5 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    {LAYER_ICONS[layer]}
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold uppercase tracking-wider text-zinc-400">{layer}</span>
                        {isChanged && (
                          <span className="px-2 py-0.5 text-[10px] rounded-full bg-purple-500/20 text-purple-300 font-semibold">CUSTOMIZED</span>
                        )}
                      </div>
                      <p className="text-white font-semibold text-base mt-0.5">{currentTech}</p>
                      {currentAlt && <p className="text-xs text-zinc-500 mt-0.5">{currentAlt.description}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-600">Swap</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                  </div>
                </button>

                {/* Alternatives Panel */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-0">
                    <div className="border-t border-zinc-800/50 pt-4 space-y-2">
                      {ALTERNATIVES[layer].map((alt) => {
                        const isActive = currentTech === alt.name;
                        const fitStyle = FIT_LABELS[alt.fit];
                        return (
                          <button
                            key={alt.name}
                            onClick={() => handleSwap(layer, alt.name)}
                            className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer
                              ${isActive
                                ? `${colors.border} ${colors.bg} ring-1 ring-current`
                                : "border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600 hover:bg-zinc-800/50"
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                {isActive && <CheckCircle2 className={`w-4 h-4 ${colors.accent}`} />}
                                <span className={`font-semibold text-sm ${isActive ? "text-white" : "text-zinc-300"}`}>{alt.name}</span>
                              </div>
                              <span className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${fitStyle.bg} ${fitStyle.text}`}>
                                {fitStyle.label}
                              </span>
                            </div>
                            <p className="text-xs text-zinc-500 mb-2">{alt.description}</p>
                            <div className="flex flex-wrap gap-1.5">
                              {alt.pros.map((pro, i) => (
                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-700/50 text-zinc-400">{pro}</span>
                              ))}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Live Architecture Summary */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            Your Architecture
          </h2>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {(["frontend", "backend", "database", "hosting"] as const).map((layer, i) => (
              <React.Fragment key={layer}>
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border shrink-0 ${LAYER_COLORS[layer].bg} ${LAYER_COLORS[layer].border}`}>
                  {LAYER_ICONS[layer]}
                  <div>
                    <div className="text-[10px] text-zinc-500 uppercase">{layer}</div>
                    <div className="text-xs font-semibold text-white whitespace-nowrap">{selections[layer]?.split(" + ")[0]}</div>
                  </div>
                </div>
                {i < 3 && <ArrowRight className="w-4 h-4 text-zinc-600 shrink-0" />}
              </React.Fragment>
            ))}
          </div>

          {/* Extras */}
          {proposal.layers.extras?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <span className="text-xs text-zinc-500 mr-2">+ Services:</span>
              {proposal.layers.extras.map((extra: string, i: number) => (
                <span key={i} className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/50 text-zinc-400 mr-1.5 mb-1">{extra}</span>
              ))}
            </div>
          )}
        </div>

        {/* Finalize Button */}
        <div className="flex justify-end">
          <button
            onClick={handleFinalize}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Finalizing...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Finalize Architecture
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
