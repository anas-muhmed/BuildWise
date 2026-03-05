"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  ArrowLeft, CheckCircle, Download, Copy, FileJson,
  Layers, Box, GitBranch, Sparkles, ArrowRight, Shield, Clock, DollarSign
} from "lucide-react";

// ── Finalize Page — Architecture Decision Record ───────────────────────────

export default function FinalizePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [architecture, setArchitecture] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(`finalstack-${projectId}`) || localStorage.getItem(`proposal-${projectId}`);
    if (stored) {
      setArchitecture(JSON.parse(stored));
    }
    setLoading(false);
  }, [projectId]);

  if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Decision Record">
        <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      </DashboardLayoutWrapper>
    );
  }

  if (!architecture) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Decision Record">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Layers className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 mb-4">No architecture found. Build one first.</p>
            <button onClick={() => router.push(`/generative-ai/${projectId}/proposal`)} className="px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors">Go to Proposals</button>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  const modules = architecture.modules || [];
  const decisions = architecture.decisions || [];
  const assumptions = architecture.assumptions || [];
  const pros = architecture.pros || [];
  const cons = architecture.cons || [];

  const handleExportJSON = () => {
    const exportData = {
      title: "Architecture Decision Record",
      approach: architecture.approach,
      name: architecture.name,
      tagline: architecture.tagline,
      modules: modules.map((m: any) => ({
        name: m.name,
        responsibility: m.responsibility,
        technology: m.tech,
        dependencies: m.depends_on,
      })),
      decisions: decisions.map((d: any) => ({
        category: d.category,
        choice: d.choice,
        reasoning: d.reasoning,
        alternatives: d.alternatives,
        confidence: d.confidence,
      })),
      stats: {
        estimatedCost: architecture.estimatedCost,
        complexity: architecture.complexity,
        timeToShip: architecture.timeToShip,
        moduleCount: modules.length,
        decisionCount: decisions.length,
      },
      assumptions,
      advantages: pros,
      tradeoffs: cons,
      customized: architecture.customized || false,
      changesFromOriginal: architecture.changesFromOriginal || 0,
      exportedAt: new Date().toISOString(),
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ADR-${architecture.name?.toLowerCase().replace(/\s+/g, "-") || "architecture"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyADR = () => {
    const lines = [
      `# Architecture Decision Record`,
      `## ${architecture.name} (${architecture.approach})`,
      `${architecture.tagline}`,
      ``,
      `## Overview`,
      `- Modules: ${modules.length}`,
      `- Decisions: ${decisions.length}`,
      `- Estimated Cost: ${architecture.estimatedCost}`,
      `- Complexity: ${architecture.complexity}`,
      `- Time to Ship: ${architecture.timeToShip}`,
      ``,
      `## System Modules`,
      ...modules.map((m: any) =>
        `### ${m.name}\n- Technology: ${m.tech}\n- Responsibility: ${m.responsibility}\n- Dependencies: ${m.depends_on?.length > 0 ? m.depends_on.join(", ") : "None"}`
      ),
      ``,
      `## Technology Decisions`,
      ...decisions.map((d: any) =>
        `### ${d.category.toUpperCase()}: ${d.choice}\n- Reasoning: ${d.reasoning}\n- Alternatives: ${d.alternatives?.join(", ") || "None"}\n- Confidence: ${d.confidence}`
      ),
      ``,
      `## Assumptions`,
      ...assumptions.map((a: string) => `- ${a}`),
      ``,
      `## Advantages`,
      ...pros.map((p: string) => `✓ ${p}`),
      ``,
      `## Trade-offs`,
      ...cons.map((c: string) => `⚠ ${c}`),
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Decision Record">
      <div className="space-y-6">

        {/* ADR Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 p-8">
          <div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push(`/generative-ai/${projectId}/builder`)}
                  className="p-2 text-zinc-400 hover:text-white bg-zinc-800/50 border border-zinc-700 rounded-lg hover:border-zinc-600 transition-all cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Architecture Decision Record</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">{architecture.name}</h1>
                  <p className="text-sm text-zinc-500 mt-0.5">{architecture.approach} — {architecture.tagline}</p>
                </div>
              </div>

              {architecture.customized && (
                <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
                  <span className="text-xs text-purple-300 font-medium">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {architecture.changesFromOriginal} customization{architecture.changesFromOriginal > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-4 text-center">
                <Box className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{modules.length}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Modules</p>
              </div>
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-4 text-center">
                <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{architecture.estimatedCost}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Monthly Cost</p>
              </div>
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-4 text-center">
                <Clock className="w-5 h-5 text-blue-400 mx-auto mb-2" />
                <p className="text-2xl font-bold text-white">{architecture.timeToShip}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Time to Ship</p>
              </div>
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-4 text-center">
                <Shield className="w-5 h-5 text-amber-400 mx-auto mb-2" />
                <p className={`text-2xl font-bold ${architecture.complexity === "Low" ? "text-green-400" : architecture.complexity === "Medium" ? "text-blue-400" : "text-amber-400"}`}>
                  {architecture.complexity}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Complexity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Section 1: System Modules */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Box className="w-5 h-5 text-purple-400" /> System Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modules.map((mod: any, i: number) => (
              <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 hover:border-zinc-700 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-white">{mod.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-medium shrink-0">{mod.tech}</span>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed mb-3">{mod.responsibility}</p>
                {mod.depends_on?.length > 0 && (
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-600">
                    <ArrowRight className="w-3 h-3" />
                    Depends on: <span className="text-zinc-400">{mod.depends_on.join(", ")}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Architecture Diagram (flow) */}
        <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" /> Module Dependency Flow
          </h2>
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {modules.map((mod: any, i: number) => {
              const hasDeps = mod.depends_on?.length > 0;
              return (
                <React.Fragment key={mod.name}>
                  {i > 0 && hasDeps && <ArrowRight className="w-5 h-5 text-zinc-600" />}
                  <div className="px-4 py-3 rounded-xl bg-zinc-800/80 border border-zinc-700/50 text-center min-w-[120px]">
                    <div className="text-xs font-semibold text-white">{mod.name}</div>
                    <div className="text-[10px] text-zinc-500 mt-0.5">{mod.tech.split(" ")[0]}</div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Section 3: Technology Decisions */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-blue-400" /> Technology Decisions
          </h2>
          <div className="space-y-3">
            {decisions.map((dec: any, i: number) => (
              <div key={i} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">{dec.category}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${dec.confidence === "high" ? "text-green-400 bg-green-500/10" :
                        dec.confidence === "medium" ? "text-blue-400 bg-blue-500/10" :
                          "text-amber-400 bg-amber-500/10"
                      }`}>{dec.confidence} confidence</span>
                  </div>
                </div>
                <p className="text-white font-semibold mb-1">{dec.choice}</p>
                <p className="text-sm text-zinc-400 leading-relaxed mb-2">{dec.reasoning}</p>
                {dec.alternatives?.length > 0 && (
                  <p className="text-xs text-zinc-600">Alternatives considered: {dec.alternatives.join(", ")}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Pros, Cons, Assumptions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {pros.length > 0 && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-green-400 mb-3">✓ Advantages</h3>
              <div className="space-y-2">
                {pros.map((pro: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-green-400 mt-0.5 shrink-0">✓</span> {pro}
                  </div>
                ))}
              </div>
            </div>
          )}
          {cons.length > 0 && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-amber-400 mb-3">⚠ Trade-offs</h3>
              <div className="space-y-2">
                {cons.map((con: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-amber-400 mt-0.5 shrink-0">⚠</span> {con}
                  </div>
                ))}
              </div>
            </div>
          )}
          {assumptions.length > 0 && (
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-zinc-400 mb-3">💡 Assumptions</h3>
              <div className="space-y-2">
                {assumptions.map((a: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                    <span className="text-zinc-500 mt-0.5 shrink-0">•</span> {a}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export Actions */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4">Export & Share</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
            >
              <FileJson className="w-4 h-4" /> Export ADR as JSON
            </button>
            <button
              onClick={handleCopyADR}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy ADR as Markdown"}
            </button>
            <button
              onClick={() => router.push("/generative-ai")}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" /> Start New Project
            </button>
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
