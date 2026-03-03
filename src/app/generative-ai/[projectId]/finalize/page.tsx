"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  ArrowLeft, CheckCircle, Download, Share2, Copy, ExternalLink,
  Monitor, Server, Database, Cloud, Sparkles, FileJson, Layers
} from "lucide-react";

const LAYER_ICONS: Record<string, React.ReactNode> = {
  frontend: <Monitor className="w-5 h-5 text-blue-400" />,
  backend: <Server className="w-5 h-5 text-purple-400" />,
  database: <Database className="w-5 h-5 text-emerald-400" />,
  hosting: <Cloud className="w-5 h-5 text-amber-400" />,
};

const LAYER_COLORS: Record<string, { bg: string; border: string; accent: string; glow: string }> = {
  frontend: { bg: "bg-blue-500/10", border: "border-blue-500/30", accent: "text-blue-400", glow: "shadow-blue-500/10" },
  backend: { bg: "bg-purple-500/10", border: "border-purple-500/30", accent: "text-purple-400", glow: "shadow-purple-500/10" },
  database: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", accent: "text-emerald-400", glow: "shadow-emerald-500/10" },
  hosting: { bg: "bg-amber-500/10", border: "border-amber-500/30", accent: "text-amber-400", glow: "shadow-amber-500/10" },
};

export default function FinalizePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [stack, setStack] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load from localStorage (saved by builder page)
    const stored = localStorage.getItem(`finalstack-${projectId}`) || localStorage.getItem(`proposal-${projectId}`);
    if (stored) {
      setStack(JSON.parse(stored));
    }
    setLoading(false);
  }, [projectId]);

  if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Summary">
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayoutWrapper>
    );
  }

  if (!stack) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Summary">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Layers className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-400 mb-4">No architecture found. Build one first.</p>
            <button
              onClick={() => router.push(`/generative-ai/${projectId}/proposal`)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer hover:bg-purple-700 transition-colors"
            >
              Go to Proposals
            </button>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  const handleExportJSON = () => {
    const exportData = {
      projectId,
      architecture: stack.name,
      customized: stack.customized || false,
      changesFromOriginal: stack.changesFromOriginal || 0,
      layers: stack.layers,
      metadata: {
        monthlyCost: stack.monthlyCost,
        complexity: stack.complexity,
        timeToShip: stack.timeToShip,
        bestFor: stack.bestFor,
        exportedAt: new Date().toISOString(),
      }
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `architecture-${stack.name?.toLowerCase().replace(/\s+/g, "-") || "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyStack = () => {
    const text = `🏗️ ${stack.name} Architecture\n\n` +
      `Frontend: ${stack.layers.frontend.tech}\n` +
      `Backend: ${stack.layers.backend.tech}\n` +
      `Database: ${stack.layers.database.tech}\n` +
      `Hosting: ${stack.layers.hosting.tech}\n` +
      (stack.layers.extras?.length > 0 ? `\nServices: ${stack.layers.extras.join(", ")}\n` : "") +
      `\nCost: ${stack.monthlyCost}/mo | Complexity: ${stack.complexity} | Ship: ${stack.timeToShip}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Architecture Summary">
      <div className="space-y-6">

        {/* Header */}
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
                    <span className="text-sm font-medium text-green-400">Architecture Complete</span>
                  </div>
                  <h1 className="text-2xl font-bold text-white">{stack.name}</h1>
                  <p className="text-sm text-zinc-500 mt-0.5">{stack.tagline}</p>
                </div>
              </div>

              {stack.customized && (
                <div className="px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
                  <span className="text-xs text-purple-300 font-medium">
                    <Sparkles className="w-3 h-3 inline mr-1" />
                    {stack.changesFromOriginal} layer{stack.changesFromOriginal > 1 ? "s" : ""} customized
                  </span>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{stack.monthlyCost}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Monthly Cost</p>
              </div>
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-white">{stack.timeToShip}</p>
                <p className="text-xs text-zinc-500 mt-0.5">Time to Ship</p>
              </div>
              <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-4 text-center">
                <p className={`text-2xl font-bold ${stack.complexity === "Low" ? "text-green-400" : stack.complexity === "Medium" ? "text-blue-400" : "text-amber-400"}`}>
                  {stack.complexity}
                </p>
                <p className="text-xs text-zinc-500 mt-0.5">Complexity</p>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Layers */}
        <div>
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-400" />
            Technology Stack
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["frontend", "backend", "database", "hosting"] as const).map((layer) => {
              const info = stack.layers[layer];
              if (!info) return null;
              const colors = LAYER_COLORS[layer];
              return (
                <div key={layer} className={`rounded-2xl border p-5 ${colors.bg} ${colors.border} shadow-lg ${colors.glow}`}>
                  <div className="flex items-center gap-2 mb-3">
                    {LAYER_ICONS[layer]}
                    <span className={`text-xs font-bold uppercase tracking-wider ${colors.accent}`}>{layer}</span>
                  </div>
                  <p className="text-white font-semibold text-lg mb-1">{info.tech}</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{info.reason}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Additional Services */}
        {stack.layers.extras?.length > 0 && (
          <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-sm font-bold text-white mb-3">Additional Services & Integrations</h2>
            <div className="flex flex-wrap gap-2">
              {stack.layers.extras.map((extra: string, i: number) => (
                <span key={i} className="px-4 py-2 text-sm bg-zinc-800/60 border border-zinc-700/50 rounded-xl text-zinc-300">
                  {extra}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pros & Cons */}
        {(stack.pros || stack.cons) && (
          <div className="grid grid-cols-2 gap-4">
            {stack.pros && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-green-400 mb-3">✓ Advantages</h2>
                <div className="space-y-2">
                  {stack.pros.map((pro: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="text-green-400 mt-0.5 shrink-0">✓</span> {pro}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stack.cons && (
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
                <h2 className="text-sm font-bold text-amber-400 mb-3">⚠ Trade-offs</h2>
                <div className="space-y-2">
                  {stack.cons.map((con: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-zinc-300">
                      <span className="text-amber-400 mt-0.5 shrink-0">⚠</span> {con}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-sm font-bold text-white mb-4">Export & Share</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportJSON}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
            >
              <FileJson className="w-4 h-4" />
              Export as JSON
            </button>
            <button
              onClick={handleCopyStack}
              className="flex items-center gap-2 px-5 py-2.5 bg-zinc-800 border border-zinc-700 rounded-xl text-sm text-zinc-300 hover:text-white hover:border-zinc-600 transition-all cursor-pointer"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied!" : "Copy Stack Summary"}
            </button>
            <button
              onClick={() => router.push(`/generative-ai`)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:opacity-90 shadow-lg shadow-purple-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              Start New Project
            </button>
          </div>
        </div>

        {/* Best For */}
        {stack.bestFor && (
          <div className="text-center py-4">
            <p className="text-xs text-zinc-600">This architecture is best suited for: <span className="text-zinc-400">{stack.bestFor}</span></p>
          </div>
        )}
      </div>
    </DashboardLayoutWrapper>
  );
}
