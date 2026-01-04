// app/generative-ai-v2/[id]/proposal/page.tsx
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
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

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
      router.push(`/generative-ai-v2/${projectId}/builder`);
    } catch (error) {
      console.error("Failed to start building:", error);
      alert("Failed to generate architecture modules. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "high": return "text-green-600 bg-green-100";
      case "medium": return "text-yellow-600 bg-yellow-100";
      case "low": return "text-orange-600 bg-orange-100";
      default: return "text-gray-600 bg-gray-100";
    }
  };

  const getConfidenceIcon = (confidence: string) => {
    switch (confidence) {
      case "high": return "✓";
      case "medium": return "⚡";
      case "low": return "⚠";
      default: return "?";
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
            Your Custom Tech Stack
          </h1>
          <p className="text-lg text-zinc-400">
            AI analyzed your requirements and crafted this stack. Review each choice below.
          </p>
        </div>

        {/* Stack Choices Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {proposal.map((choice, idx) => {
            const isExpanded = expandedCard === choice.component;
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
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${getConfidenceColor(choice.confidence)}`}>
                      {getConfidenceIcon(choice.confidence)} {choice.confidence.toUpperCase()}
                    </div>
                  </div>

                {/* Rationale */}
                <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <div className="text-sm font-semibold text-white mb-2">Why this?</div>
                  <p className="text-sm text-zinc-300">{choice.rationale}</p>
                </div>

                {/* Alternatives & Resources (collapsible) */}
                {!isExpanded && (
                  <button
                    onClick={() => setExpandedCard(choice.component)}
                    className="text-sm text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                  >
                    → Show alternatives & resources
                  </button>
                )}

                {isExpanded && (
                  <div className="space-y-4 animate-fadeIn">
                    {/* Alternatives */}
                    {choice.alternatives && choice.alternatives.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-white mb-2">Alternatives</div>
                        <div className="flex flex-wrap gap-2">
                          {choice.alternatives.map((alt, i) => (
                            <span 
                              key={i}
                              className="px-3 py-1 bg-zinc-800 text-zinc-300 rounded-full text-xs font-medium"
                            >
                                {alt}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                    {/* Learning Resources */}
                    {choice.learning_resources && choice.learning_resources.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold text-white mb-2">Learning Resources</div>
                        <div className="space-y-2">
                          {choice.learning_resources.map((resource, i) => (
                            <a
                              key={i}
                              href={resource.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              📚 {resource.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => setExpandedCard(null)}
                      className="text-sm text-zinc-500 hover:text-zinc-400 cursor-pointer"
                    >
                      ↑ Collapse
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => router.push(`/generative-ai-v2/${projectId}/intake`)}
            className="px-6 py-3 bg-zinc-800 text-zinc-300 rounded-xl font-medium hover:bg-zinc-700 transition-all cursor-pointer"
          >
            ← Revise Requirements
          </button>
          <button
            onClick={handleStartBuilding}
            className="px-12 py-4 bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 text-white text-lg font-semibold rounded-xl hover:opacity-90 shadow-xl shadow-purple-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            Start Building Architecture →
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
