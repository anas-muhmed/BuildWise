"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { useRequireAuth } from "@/lib/useRequireAuth";
import { Sparkles, Zap, Shield, DollarSign, Clock, CheckCircle2, ArrowRight, RotateCcw, AlertTriangle } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ArchOption {
  id: string;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  gradient: string;
  borderColor: string;
  shadowColor: string;
  layers: {
    frontend: { tech: string; reason: string };
    backend: { tech: string; reason: string };
    database: { tech: string; reason: string };
    hosting: { tech: string; reason: string };
    extras: string[];
  };
  pros: string[];
  cons: string[];
  monthlyCost: string;
  complexity: "Low" | "Medium" | "High";
  timeToShip: string;
  bestFor: string;
}

// Map option id to visual styling
const OPTION_STYLES: Record<string, { icon: React.ReactNode; gradient: string; borderColor: string; shadowColor: string }> = {
  speed: {
    icon: <Zap className="w-6 h-6" />,
    gradient: "from-amber-500 to-orange-500",
    borderColor: "border-amber-500/40",
    shadowColor: "shadow-amber-500/20",
  },
  balanced: {
    icon: <Shield className="w-6 h-6" />,
    gradient: "from-blue-500 to-indigo-500",
    borderColor: "border-blue-500/40",
    shadowColor: "shadow-blue-500/20",
  },
  enterprise: {
    icon: <Sparkles className="w-6 h-6" />,
    gradient: "from-purple-500 to-pink-500",
    borderColor: "border-purple-500/40",
    shadowColor: "shadow-purple-500/20",
  },
};

// ── Proposal Page ──────────────────────────────────────────────────────────

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [options, setOptions] = useState<ArchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [aiSource, setAiSource] = useState<"ai" | "mock">("mock");

  // Loading text animation
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Reading your requirements...",
    "Building context for AI...",
    "Generating architecture proposals...",
    "Analyzing trade-offs...",
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, loadingSteps.length]);

  // Fetch proposals from API
  const fetchProposals = async () => {
    setLoading(true);
    setError(null);
    setShowOptions(false);
    setSelectedId(null);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/generate-proposal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setAiSource(data.source || "mock");

      // Map API response to UI format (add visual styling)
      const styled: ArchOption[] = (data.options || []).map((opt: any, idx: number) => {
        const styleKey = opt.id || ["speed", "balanced", "enterprise"][idx];
        const style = OPTION_STYLES[styleKey] || OPTION_STYLES.balanced;
        return {
          ...opt,
          id: styleKey,
          icon: style.icon,
          gradient: style.gradient,
          borderColor: style.borderColor,
          shadowColor: style.shadowColor,
        };
      });

      setOptions(styled);
      setLoading(false);
      setTimeout(() => setShowOptions(true), 150);
    } catch (err) {
      console.error("Proposal generation failed:", err);
      setError("Failed to generate proposals. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && isAuthenticated) {
      fetchProposals();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isAuthenticated]);

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) return null;

  const selected = options.find(o => o.id === selectedId);

  const handleApprove = () => {
    if (!selected) return;
    localStorage.setItem(`proposal-${projectId}`, JSON.stringify(selected));
    router.push(`/generative-ai/${projectId}/builder`);
  };

  // ── Loading State ──
  if (loading) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Proposal">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 animate-spin" style={{ clipPath: "polygon(50% 0%, 100% 0%, 100% 50%, 50% 50%)" }} />
              <div className="absolute inset-1 rounded-full bg-zinc-950 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{loadingSteps[loadingStep]}</p>
              <p className="text-sm text-zinc-500 mt-1">GPT-4.1 is analyzing your project requirements</p>
            </div>
            <div className="flex items-center justify-center gap-6 text-xs text-zinc-600">
              <span className="flex items-center gap-1">
                {loadingStep >= 1 ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 border border-purple-500 border-t-transparent rounded-full animate-spin" />}
                Context
              </span>
              <span className="flex items-center gap-1">
                {loadingStep >= 2 ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 border border-zinc-600 rounded-full" />}
                AI Generation
              </span>
              <span className="flex items-center gap-1">
                {loadingStep >= 3 ? <CheckCircle2 className="w-3 h-3 text-green-500" /> : <div className="w-3 h-3 border border-zinc-600 rounded-full" />}
                Validation
              </span>
            </div>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  // ── Error State ──
  if (error) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Proposal">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <p className="text-lg font-semibold text-white">{error}</p>
            <button
              onClick={fetchProposals}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Proposal">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              AI Architecture Proposals
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {aiSource === "ai" ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Generated by GPT-4.1 — tailored to your requirements
                </span>
              ) : (
                "3 architecture approaches based on your requirements. Pick the one that fits."
              )}
            </p>
          </div>
          <button
            onClick={fetchProposals}
            className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Regenerate
          </button>
        </div>

        {/* 3 Option Cards */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 transition-all duration-500 ${showOptions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {options.map((opt) => {
            const isSelected = selectedId === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedId(opt.id)}
                className={`relative text-left rounded-2xl border p-6 transition-all duration-300 cursor-pointer group
                  ${isSelected
                    ? `${opt.borderColor} bg-zinc-900/90 scale-[1.02] shadow-xl ${opt.shadowColor} ring-2 ring-current`
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900/70"
                  }`}
              >
                {/* Badge */}
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">✓</div>
                )}

                {/* Icon + Title */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {opt.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{opt.name}</h3>
                    <p className="text-xs text-zinc-500">{opt.tagline}</p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <DollarSign className="w-3 h-3 mx-auto text-green-400 mb-0.5" />
                    <div className="text-xs font-semibold text-white">{opt.monthlyCost}</div>
                    <div className="text-[10px] text-zinc-600">monthly</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <Clock className="w-3 h-3 mx-auto text-blue-400 mb-0.5" />
                    <div className="text-xs font-semibold text-white">{opt.timeToShip}</div>
                    <div className="text-[10px] text-zinc-600">to ship</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <Zap className="w-3 h-3 mx-auto text-amber-400 mb-0.5" />
                    <div className="text-xs font-semibold text-white">{opt.complexity}</div>
                    <div className="text-[10px] text-zinc-600">complexity</div>
                  </div>
                </div>

                {/* Stack Preview */}
                <div className="space-y-1.5 mb-4">
                  {Object.entries(opt.layers).filter(([k]) => k !== "extras").map(([layer, info]) => (
                    <div key={layer} className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-zinc-600 capitalize shrink-0">{layer}</span>
                      <span className="text-zinc-300 font-medium">{(info as any).tech}</span>
                    </div>
                  ))}
                </div>

                {/* Pros */}
                <div className="space-y-1">
                  {opt.pros.slice(0, 2).map((pro, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-green-400">
                      <span>✓</span> {pro}
                    </div>
                  ))}
                  {opt.cons.slice(0, 1).map((con, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-amber-400">
                      <span>⚠</span> {con}
                    </div>
                  ))}
                </div>

                {/* Best For */}
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Best for</p>
                  <p className="text-xs text-zinc-400">{opt.bestFor}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed View (when selected) */}
        {selected && (
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.name} — Full Stack Breakdown</h2>
                <p className="text-sm text-zinc-500 mt-1">Here&apos;s exactly why each technology was chosen for your project.</p>
              </div>
              <button
                onClick={handleApprove}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" />
                Use This Stack
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Layer Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(selected.layers).filter(([k]) => k !== "extras").map(([layer, info]) => (
                <div key={layer} className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{layer}</span>
                  </div>
                  <p className="text-white font-semibold text-sm mb-1">{(info as any).tech}</p>
                  <p className="text-xs text-zinc-400 leading-relaxed">{(info as any).reason}</p>
                </div>
              ))}
            </div>

            {/* Extras */}
            {selected.layers.extras && selected.layers.extras.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-2">Additional Services</h3>
                <div className="flex flex-wrap gap-2">
                  {selected.layers.extras.map((extra, i) => (
                    <span key={i} className="px-3 py-1.5 text-xs bg-zinc-800/60 border border-zinc-700/50 rounded-full text-zinc-300">
                      {extra}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Pros & Cons */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-green-400 mb-2">Advantages</h3>
                <div className="space-y-1.5">
                  {selected.pros.map((pro, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-green-400 mt-0.5">✓</span> {pro}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-amber-400 mb-2">Trade-offs</h3>
                <div className="space-y-1.5">
                  {selected.cons.map((con, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-amber-400 mt-0.5">⚠</span> {con}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}
