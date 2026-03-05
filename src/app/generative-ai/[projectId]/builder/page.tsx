"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { useRequireAuth } from "@/lib/useRequireAuth";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Layers, Box, GitBranch,
  ChevronDown, ChevronUp, Sparkles, Edit3, Info
} from "lucide-react";

// ── Technology alternatives for swapping ────────────────────────────────────

const TECH_ALTERNATIVES: Record<string, string[]> = {
  frontend: ["Next.js 14 + TypeScript", "React + Vite + Zustand", "Vue 3 + Nuxt", "Angular + Material UI", "Svelte + SvelteKit", "Next.js (Static Export) + CloudFront"],
  backend: ["Next.js API Routes", "Node.js + Express", "Node.js + Express + JWT", "Python + FastAPI", "Go + Gin", "AWS Lambda + API Gateway", "Java + Spring Boot"],
  database: ["MongoDB Atlas", "PostgreSQL", "MongoDB", "MySQL", "DynamoDB", "Supabase", "PlanetScale"],
  auth: ["NextAuth.js + JWT", "AWS Cognito + DynamoDB", "Firebase Auth", "Auth0", "Clerk", "Custom JWT"],
  payments: ["Stripe SDK", "Node.js + Stripe", "Lambda + Stripe Webhooks", "PayPal SDK", "Razorpay"],
  realtime: ["Socket.io", "Node.js + Socket.io + Redis Pub/Sub", "AWS AppSync / API Gateway WebSocket", "Pusher", "Ably"],
  deployment: ["Vercel", "Docker + Railway", "AWS CDK (Infrastructure as Code)", "DigitalOcean App Platform", "Kubernetes (EKS/GKE)", "Render"],
  cache: ["Redis", "Memcached", "DynamoDB DAX", "Cloudflare KV"],
};

// ── Builder Page ───────────────────────────────────────────────────────────

export default function BuilderPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth();

  const [proposal, setProposal] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [editingDecision, setEditingDecision] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [changeCount, setChangeCount] = useState(0);

  // Load the selected proposal
  useEffect(() => {
    const stored = localStorage.getItem(`proposal-${projectId}`);
    if (stored) {
      const parsed = JSON.parse(stored);
      setProposal(parsed);
      setModules(parsed.modules || []);
      setDecisions(parsed.decisions || []);
    }
  }, [projectId]);

  if (authLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

  if (!proposal) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Customize Architecture">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">No proposal selected. Pick an architecture first.</p>
            <button onClick={() => router.push(`/generative-ai/${projectId}/proposal`)} className="px-4 py-2 bg-purple-600 text-white rounded-lg cursor-pointer">Go to Proposals</button>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  const swapDecisionTech = (decIdx: number, newTech: string) => {
    const updated = [...decisions];
    updated[decIdx] = { ...updated[decIdx], choice: newTech };
    setDecisions(updated);
    setEditingDecision(null);
    setChangeCount(prev => prev + 1);
  };

  const handleFinalize = () => {
    setIsSaving(true);
    const finalData = {
      ...proposal,
      modules,
      decisions,
      customized: changeCount > 0,
      changesFromOriginal: changeCount,
    };
    localStorage.setItem(`finalstack-${projectId}`, JSON.stringify(finalData));
    setTimeout(() => {
      router.push(`/generative-ai/${projectId}/finalize`);
    }, 600);
  };

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Customize Architecture">
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
                Customize Architecture
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Starting from <span className="text-purple-400 font-medium">{proposal.name}</span> ({proposal.approach}) — edit modules and swap technologies
              </p>
            </div>
          </div>
          {changeCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30">
              <Edit3 className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-purple-300 font-medium">{changeCount} change{changeCount > 1 ? "s" : ""}</span>
            </div>
          )}
        </div>

        {/* System Modules */}
        <div>
          <h2 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <Box className="w-4 h-4 text-purple-400" /> System Modules ({modules.length})
          </h2>
          <div className="space-y-3">
            {modules.map((mod, idx) => {
              const isExpanded = expandedModule === mod.name;
              return (
                <div key={idx} className={`rounded-2xl border transition-all duration-200 ${isExpanded ? "border-purple-500/40 bg-purple-500/5" : "border-zinc-800 bg-zinc-900/50"}`}>
                  <button
                    onClick={() => setExpandedModule(isExpanded ? null : mod.name)}
                    className="w-full flex items-center justify-between p-5 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                        <Box className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-white font-semibold text-sm">{mod.name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">{mod.responsibility}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 font-medium">{mod.tech}</span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-500" /> : <ChevronDown className="w-4 h-4 text-zinc-500" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-zinc-800/50 pt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Technology</span>
                            <p className="text-sm text-white font-medium mt-1">{mod.tech}</p>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Dependencies</span>
                            <p className="text-sm text-zinc-300 mt-1">
                              {mod.depends_on.length > 0 ? mod.depends_on.join(" → ") : "None (independent)"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">Responsibility</span>
                          <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{mod.responsibility}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Architecture Decisions */}
        <div>
          <h2 className="text-sm font-bold text-zinc-300 mb-3 flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-400" /> Technology Decisions ({decisions.length})
            <span className="text-[10px] text-zinc-600 font-normal ml-1">Click to swap technologies</span>
          </h2>
          <div className="space-y-3">
            {decisions.map((dec, idx) => {
              const isEditing = editingDecision === idx;
              const category = dec.category?.toLowerCase() || "other";
              const alts = TECH_ALTERNATIVES[category] || [];

              return (
                <div key={idx} className={`rounded-2xl border transition-all duration-200 ${isEditing ? "border-blue-500/40 bg-blue-500/5" : "border-zinc-800 bg-zinc-900/50"}`}>
                  <button
                    onClick={() => setEditingDecision(isEditing ? null : idx)}
                    className="w-full flex items-center justify-between p-5 cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-left">
                        <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold">{dec.category}</span>
                        <h3 className="text-white font-semibold text-sm mt-0.5">{dec.choice}</h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${dec.confidence === "high" ? "text-green-400 bg-green-500/10" :
                          dec.confidence === "medium" ? "text-blue-400 bg-blue-500/10" :
                            "text-amber-400 bg-amber-500/10"
                        }`}>{dec.confidence}</span>
                      <Edit3 className="w-3.5 h-3.5 text-zinc-600" />
                    </div>
                  </button>

                  {isEditing && (
                    <div className="px-5 pb-5 pt-0">
                      <div className="border-t border-zinc-800/50 pt-4 space-y-3">
                        {/* Reasoning */}
                        <div className="flex items-start gap-2 p-3 bg-zinc-800/30 rounded-lg">
                          <Info className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                          <p className="text-xs text-zinc-400 leading-relaxed">{dec.reasoning}</p>
                        </div>

                        {/* Swap Options */}
                        {alts.length > 0 && (
                          <div>
                            <span className="text-[10px] uppercase tracking-wider text-zinc-600 font-semibold block mb-2">Swap to:</span>
                            <div className="flex flex-wrap gap-2">
                              {alts.map((alt) => {
                                const isCurrent = alt === dec.choice;
                                return (
                                  <button
                                    key={alt}
                                    onClick={() => !isCurrent && swapDecisionTech(idx, alt)}
                                    className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer
                                      ${isCurrent
                                        ? "bg-purple-500/20 border-purple-500/40 text-purple-300 font-semibold"
                                        : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-white hover:border-zinc-600"
                                      }`}
                                  >
                                    {isCurrent && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                                    {alt}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {dec.alternatives?.length > 0 && (
                          <p className="text-[10px] text-zinc-600">AI also considered: {dec.alternatives.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Architecture Summary Bar */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-5">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" /> Architecture Summary
          </h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{modules.length}</div>
              <div className="text-[10px] text-zinc-500">Modules</div>
            </div>
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{decisions.length}</div>
              <div className="text-[10px] text-zinc-500">Decisions</div>
            </div>
            <div className="bg-zinc-800/40 border border-zinc-700/30 rounded-xl p-3 text-center">
              <div className={`text-lg font-bold ${proposal.complexity === "Low" ? "text-green-400" : proposal.complexity === "Medium" ? "text-blue-400" : "text-amber-400"}`}>
                {proposal.complexity}
              </div>
              <div className="text-[10px] text-zinc-500">Complexity</div>
            </div>
          </div>

          {/* Module flow visualization */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {modules.map((mod, i) => (
              <React.Fragment key={mod.name}>
                <div className="shrink-0 px-3 py-2 rounded-lg bg-zinc-800/60 border border-zinc-700/50">
                  <div className="text-[10px] text-zinc-500">{mod.name.split(" ")[0]}</div>
                  <div className="text-[10px] font-medium text-zinc-300 whitespace-nowrap">{mod.tech.split(" ")[0]}</div>
                </div>
                {i < modules.length - 1 && <ArrowRight className="w-3 h-3 text-zinc-700 shrink-0" />}
              </React.Fragment>
            ))}
          </div>
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
                Generating ADR...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Generate Architecture Decision Record
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
