// app/generative-ai/[id]/proposal/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";

// 🎯 MASTER PLAN: Phase 2 - Stack Proposal with Storytelling
// Show cards with "Why this?" rationale, confidence, alternatives

type StackChoice = {
  component: string;
  choice: string;
  rationale: string;
  confidence: "low" | "medium" | "high";
  alternatives?: string[];
  learning_resources?: { title: string; url: string }[];
};

export default function ProposalPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<StackChoice[] | null>(null);

  useEffect(() => {
    loadProposal();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadProposal = async () => {
    try {
      // Check if proposal already exists
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/proposal`, {
        headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });
      if (res.ok) {
        const data = await res.json();
        setProposal(data.components);
        setIsLoading(false);
      } else {
        // Generate new proposal
        await generateProposal();
      }
    } catch (error) {
      console.error(error);
      await generateProposal();
    }
  };

  const generateProposal = async () => {
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/proposal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }
      });

      if (!res.ok) throw new Error("Failed to generate proposal");

      const data = await res.json();
      setProposal(data.components);
    } catch (error) {
      console.error(error);
      alert("Failed to generate proposal. Please try again.");
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleStartBuilding = async () => {
    setIsLoading(true);
    try {
      // Generate modules from proposal
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/modules/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        throw new Error("Failed to generate modules");
      }

      const data = await res.json();
      console.log("Modules generated:", data);

      // Navigate to builder
      router.push(`/generative-ai/${projectId}/builder`);
    } catch (error) {
      console.error("Failed to start building:", error);
      alert("Failed to generate architecture modules. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || isGenerating) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Tech Stack Proposal">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce">🧠</div>
            <div className="text-2xl font-bold text-white mb-2">
              AI is analyzing your requirements...
            </div>
            <div className="text-zinc-400">Building your custom tech stack</div>
            <div className="mt-6 w-64 mx-auto bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 rounded-full animate-pulse" style={{width: "70%"}} />
            </div>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  if (!proposal) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Tech Stack Proposal">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-red-400">Failed to load proposal</div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Tech Stack Proposal">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-4xl font-extrabold text-white mb-3">
            Architecture Decision Ledger (v1)
          </h1>
          <p className="text-lg text-zinc-400">
            Locked architectural decisions based on your intake constraints.
          </p>
        </div>

        {/* Stack Choices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {proposal.map((choice, idx) => {
            return (
              <div 
                key={idx}
                className="bg-zinc-900 rounded-2xl border-2 border-zinc-800 p-6 transition-all hover:border-zinc-700 hover:scale-105"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                      {choice.component}
                    </div>
                    <div className="text-2xl font-bold text-white mt-1">
                      {choice.choice}
                    </div>
                  </div>
                  <div className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400">
                    LOCKED
                  </div>
                </div>

                {/* Decision Basis */}
                <div className="mb-4">
                  <div className="text-sm text-zinc-400 mb-2">
                    Decision basis derived from intake constraints.
                  </div>
                  <ul className="text-sm text-zinc-300 list-disc pl-5 space-y-1">
                    {choice.rationale.split(".").filter(r => r.trim()).map((r, i) => (
                      <li key={i}>{r.trim()}.</li>
                    ))}
                  </ul>
                </div>

                {/* Trade-offs (optional alternatives shown minimally) */}
                {choice.alternatives && choice.alternatives.length > 0 && (
                  <div>
                    <div className="text-sm font-semibold text-zinc-400 mb-2">Trade-offs</div>
                    <div className="flex flex-wrap gap-2">
                      {choice.alternatives.slice(0, 3).map((alt, i) => (
                        <span 
                          key={i}
                          className="px-3 py-1 bg-zinc-800/50 text-zinc-400 rounded-full text-xs"
                        >
                          vs {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push(`/generative-ai/${projectId}/intake`)}
            className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 transition-all cursor-pointer"
          >
            ← Revise Requirements
          </button>
          <button
            onClick={handleStartBuilding}
            className="px-12 py-4 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white text-lg font-semibold rounded-xl hover:opacity-90 shadow-xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Generate Architecture →
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </DashboardLayoutWrapper>
  );
}
