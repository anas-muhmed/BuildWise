"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  Sparkles, Zap, Shield, Cloud, CheckCircle2, ArrowRight, RotateCcw,
  AlertTriangle, Box, GitBranch, ChevronDown, ChevronUp
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────

interface ArchModule {
  name: string;
  responsibility: string;
  tech: string;
  depends_on: string[];
}

interface ArchDecision {
  category: string;
  choice: string;
  reasoning: string;
  alternatives: string[];
  confidence: "high" | "medium" | "low";
}

interface ArchProposal {
  id: string;
  approach: string;
  name: string;
  tagline: string;
  modules: ArchModule[];
  decisions: ArchDecision[];
  assumptions: string[];
  pros: string[];
  cons: string[];
  estimatedCost: string;
  complexity: "Low" | "Medium" | "High";
  timeToShip: string;
}

// ── Visual Styles ──────────────────────────────────────────────────────────

const APPROACH_STYLES: Record<string, { icon: React.ReactNode; gradient: string; border: string; shadow: string; bg: string }> = {
  monolith: {
    icon: <Box className="w-6 h-6" />,
    gradient: "from-amber-500 to-orange-500",
    border: "border-amber-500/40",
    shadow: "shadow-amber-500/20",
    bg: "bg-amber-500/10",
  },
  "service-oriented": {
    icon: <GitBranch className="w-6 h-6" />,
    gradient: "from-blue-500 to-indigo-500",
    border: "border-blue-500/40",
    shadow: "shadow-blue-500/20",
    bg: "bg-blue-500/10",
  },
  "event-driven": {
    icon: <Cloud className="w-6 h-6" />,
    gradient: "from-purple-500 to-pink-500",
    border: "border-purple-500/40",
    shadow: "shadow-purple-500/20",
    bg: "bg-purple-500/10",
  },
};

const CONFIDENCE_COLORS = {
  high: "text-green-400 bg-green-500/10",
  medium: "text-blue-400 bg-blue-500/10",
  low: "text-amber-400 bg-amber-500/10",
};

// ── Proposal Page ──────────────────────────────────────────────────────────

export default function ProposalPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [proposals, setProposals] = useState<ArchProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [aiSource, setAiSource] = useState<"ai" | "mock">("mock");
  const [expandedDecisions, setExpandedDecisions] = useState(false);

  // Loading animation
  const [loadingStep, setLoadingStep] = useState(0);
  const loadingSteps = [
    "Analyzing requirements...",
    "Designing monolith approach...",
    "Designing service architecture...",
    "Designing event-driven system...",
    "Comparing trade-offs...",
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % loadingSteps.length);
      }, 1800);
      return () => clearInterval(interval);
    }
  }, [loading, loadingSteps.length]);

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

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      setAiSource(data.source || "mock");
      setProposals(data.proposals || []);
      setLoading(false);
      setTimeout(() => setShowOptions(true), 150);
    } catch (err) {
      console.error("Proposal generation failed:", err);
      setError("Failed to generate proposals. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && isAuthenticated) fetchProposals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, isAuthenticated]);

  if (authLoading) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  }
  if (!isAuthenticated) return null;

  const selected = proposals.find(p => p.id === selectedId);

  const handleApprove = () => {
    if (!selected) return;
    localStorage.setItem(`proposal-${projectId}`, JSON.stringify(selected));
    router.push(`/generative-ai/${projectId}/builder`);
  };

  // ── Loading ──
  if (loading) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Proposals">
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
              <p className="text-sm text-zinc-500 mt-1">GPT-4.1 is designing your system architecture</p>
            </div>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Proposals">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto" />
            <p className="text-lg font-semibold text-white">{error}</p>
            <button onClick={fetchProposals} className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 cursor-pointer">Try Again</button>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Proposals">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Architecture Proposals
            </h1>
            <p className="text-sm text-zinc-500 mt-1">
              {aiSource === "ai" ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-flex w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Designed by GPT-4.1 — 3 architecturally different approaches
                </span>
              ) : "3 architecturally different approaches tailored to your requirements"}
            </p>
          </div>
          <button onClick={fetchProposals} className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-400 hover:text-white bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-all cursor-pointer">
            <RotateCcw className="w-4 h-4" /> Regenerate
          </button>
        </div>

        {/* 3 Proposal Cards */}
        <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 transition-all duration-500 ${showOptions ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          {proposals.map((proposal) => {
            const isSelected = selectedId === proposal.id;
            const style = APPROACH_STYLES[proposal.id] || APPROACH_STYLES.monolith;
            return (
              <button
                key={proposal.id}
                onClick={() => setSelectedId(proposal.id)}
                className={`relative text-left rounded-2xl border p-5 transition-all duration-300 cursor-pointer group
                  ${isSelected
                    ? `${style.border} bg-zinc-900/90 scale-[1.02] shadow-xl ${style.shadow} ring-2 ring-current`
                    : "border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-900/70"
                  }`}
              >
                {isSelected && (
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">✓</div>
                )}

                {/* Approach + Name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.gradient} flex items-center justify-center text-white shadow-lg`}>
                    {style.icon}
                  </div>
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{proposal.approach}</span>
                    <h3 className="font-bold text-white text-base">{proposal.name}</h3>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 mb-4">{proposal.tagline}</p>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <div className="text-xs font-semibold text-white">{proposal.modules.length}</div>
                    <div className="text-[10px] text-zinc-600">modules</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <div className="text-xs font-semibold text-white">{proposal.estimatedCost}</div>
                    <div className="text-[10px] text-zinc-600">monthly</div>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <div className="text-xs font-semibold text-white">{proposal.timeToShip}</div>
                    <div className="text-[10px] text-zinc-600">to ship</div>
                  </div>
                </div>

                {/* Module Preview */}
                <div className="space-y-1 mb-3">
                  {proposal.modules.slice(0, 4).map((mod) => (
                    <div key={mod.name} className="flex items-center gap-2 text-xs">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shrink-0" />
                      <span className="text-zinc-300 font-medium truncate">{mod.name}</span>
                      <span className="text-zinc-600 ml-auto text-[10px] shrink-0">{mod.tech.split(" ")[0]}</span>
                    </div>
                  ))}
                  {proposal.modules.length > 4 && (
                    <div className="text-[10px] text-zinc-600 pl-4">+{proposal.modules.length - 4} more modules</div>
                  )}
                </div>

                {/* Pros/Cons */}
                <div className="space-y-1">
                  {proposal.pros.slice(0, 2).map((pro, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-green-400"><span>✓</span> {pro}</div>
                  ))}
                  {proposal.cons.slice(0, 1).map((con, i) => (
                    <div key={i} className="flex items-center gap-1.5 text-xs text-amber-400"><span>⚠</span> {con}</div>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Proposal — Full Detail View */}
        {selected && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header + Approve Button */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-white">{selected.name} — Architecture Breakdown</h2>
                  <p className="text-sm text-zinc-500 mt-1">{selected.approach} approach with {selected.modules.length} system modules</p>
                </div>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-semibold hover:opacity-90 shadow-xl shadow-purple-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Use This Architecture
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Module Diagram */}
              <h3 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
                <Box className="w-4 h-4 text-purple-400" /> System Modules
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {selected.modules.map((mod) => {
                  const style = APPROACH_STYLES[selected.id] || APPROACH_STYLES.monolith;
                  return (
                    <div key={mod.name} className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
                      <h4 className="font-semibold text-white text-sm mb-1">{mod.name}</h4>
                      <p className="text-[11px] text-zinc-400 mb-2 leading-relaxed">{mod.responsibility}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-medium">{mod.tech}</span>
                        {mod.depends_on.length > 0 && (
                          <span className="text-[10px] text-zinc-600">→ {mod.depends_on.join(", ")}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Decisions */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
              <button
                onClick={() => setExpandedDecisions(!expandedDecisions)}
                className="w-full flex items-center justify-between cursor-pointer"
              >
                <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-blue-400" /> Architecture Decisions ({selected.decisions.length})
                </h3>
                {expandedDecisions ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
              </button>

              {expandedDecisions && (
                <div className="mt-4 space-y-3">
                  {selected.decisions.map((dec, i) => (
                    <div key={i} className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{dec.category}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${CONFIDENCE_COLORS[dec.confidence]}`}>
                            {dec.confidence} confidence
                          </span>
                        </div>
                      </div>
                      <p className="text-white font-semibold text-sm mb-1">{dec.choice}</p>
                      <p className="text-xs text-zinc-400 leading-relaxed mb-2">{dec.reasoning}</p>
                      {dec.alternatives.length > 0 && (
                        <p className="text-[10px] text-zinc-600">Alternatives considered: {dec.alternatives.join(", ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pros, Cons, Assumptions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-green-400 mb-3">✓ Advantages</h3>
                <div className="space-y-2">
                  {selected.pros.map((pro, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-green-400 mt-0.5 shrink-0">✓</span> {pro}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-amber-400 mb-3">⚠ Trade-offs</h3>
                <div className="space-y-2">
                  {selected.cons.map((con, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-amber-400 mt-0.5 shrink-0">⚠</span> {con}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-zinc-400 mb-3">💡 Assumptions</h3>
                <div className="space-y-2">
                  {selected.assumptions.map((a, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-zinc-300">
                      <span className="text-zinc-500 mt-0.5 shrink-0">•</span> {a}
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
