"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import StepFooter from "@/components/student-mode/StepFooter";

export default function SummaryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [project, setProject] = useState<any>(null);
  const [reasoning, setReasoning] = useState<any>(null);
  const [architecture, setArchitecture] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [projRes, reasonRes, archRes] = await Promise.all([
          fetch(`/api/student-mode/define?projectId=${projectId}`),
          fetch(`/api/student-mode/reasoning?projectId=${projectId}`),
          fetch(`/api/student-mode/materialize?projectId=${projectId}`),
        ]);

        const projData = await projRes.json();
        const reasonData = await reasonRes.json();
        const archResponse = await archRes.json();
        
        // Extract architecture from full contract
        const archData = archResponse.architecture || archResponse;

        setProject(projData);
        setReasoning(reasonData);
        setArchitecture(archData);
      } catch (err) {
        console.error("Failed to load summary:", err);
      }
    }

    loadData();
  }, [projectId]);

  if (!project || !reasoning || !architecture) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading summary...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8 space-y-2 text-center">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-cyan-500/20 blur-3xl"></div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent relative">
              Project Summary
            </h1>
          </div>
          <p className="text-zinc-400">
            Everything you need for your viva defense
          </p>
        </div>

        {/* Project Definition */}
        <div className="mb-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Project Definition</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">📦</div>
              <div>
                <div className="text-xs text-zinc-400 uppercase mb-1">Project Name</div>
                <div className="font-medium text-white">{project.name}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">🎯</div>
              <div>
                <div className="text-xs text-zinc-400 uppercase mb-1">Goal</div>
                <div className="font-medium text-white">{project.goal}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">👥</div>
              <div>
                <div className="text-xs text-zinc-400 uppercase mb-1">Audience</div>
                <div className="font-medium text-white capitalize">{project.audience}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Architecture Stats */}
        <div className="mb-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Architecture Overview</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                {architecture.nodes?.length || 0}
              </div>
              <div className="text-sm text-zinc-400 mt-1">Components</div>
            </div>
            <div className="bg-zinc-800/50 rounded-lg p-4">
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                {architecture.edges?.length || 0}
              </div>
              <div className="text-sm text-zinc-400 mt-1">Connections</div>
            </div>
          </div>
        </div>

        {/* Execution Summary (merged from execution page) */}
        <div className="mb-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Execution Phases</h2>
          <div className="space-y-3">
            <div className="bg-zinc-800/30 rounded-lg p-4 border-l-4 border-purple-500">
              <div className="font-semibold text-purple-400">Phase 1 – Foundation</div>
              <div className="text-sm text-zinc-400 mt-1">Database and core APIs must be built first</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-4 border-l-4 border-blue-500">
              <div className="font-semibold text-blue-400">Phase 2 – Application Logic</div>
              <div className="text-sm text-zinc-400 mt-1">Business services depend on stable backend</div>
            </div>
            <div className="bg-zinc-800/30 rounded-lg p-4 border-l-4 border-cyan-500">
              <div className="font-semibold text-cyan-400">Phase 3 – Client Layer</div>
              <div className="text-sm text-zinc-400 mt-1">Frontend integrates once APIs are ready</div>
            </div>
          </div>
        </div>

        {/* Risk Analysis (merged from risks page) */}
        <div className="mb-6 bg-gradient-to-br from-red-900/10 to-orange-900/10 border border-red-700/30 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-400">Key Risks & Mitigations</h2>
          <div className="space-y-3">
            <div className="bg-zinc-900/50 rounded-lg p-4">
              <div className="font-semibold text-white mb-1">Single Database Dependency</div>
              <div className="text-sm text-red-300 mb-2">⚠ Database failure causes total system outage</div>
              <div className="text-sm text-green-400">✓ Mitigation: Add read replicas and regular backups</div>
            </div>
          </div>
        </div>

        {/* Key Decisions */}
        <div className="mb-6 bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Key Design Decisions</h2>
          <div className="space-y-3">
            {Object.entries(reasoning.answers || {}).slice(0, 5).map(([key, value]: [string, any]) => (
              <div key={key} className="bg-zinc-800/30 rounded-lg p-3 border-l-4 border-indigo-500">
                <div className="text-xs text-zinc-400 uppercase mb-1">{key.replace(/_/g, ' ')}</div>
                <div className="font-medium text-white">{value?.toString() || 'N/A'}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Viva Defense Checklist */}
        <div className="bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border border-indigo-700/50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center text-2xl">🎓</div>
            <h2 className="text-xl font-semibold text-indigo-300">Viva Defense Checklist</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-zinc-900/30 rounded-lg p-3">
              <span className="text-green-400 text-xl flex-shrink-0">✓</span>
              <span className="text-sm text-zinc-300">Explain each architecture decision with reasoning from your answers</span>
            </div>
            <div className="flex items-start gap-3 bg-zinc-900/30 rounded-lg p-3">
              <span className="text-green-400 text-xl flex-shrink-0">✓</span>
              <span className="text-sm text-zinc-300">Reference team distribution when discussing implementation timeline</span>
            </div>
            <div className="flex items-start gap-3 bg-zinc-900/30 rounded-lg p-3">
              <span className="text-green-400 text-xl flex-shrink-0">✓</span>
              <span className="text-sm text-zinc-300">Mention cost tradeoffs and scalability considerations</span>
            </div>
            <div className="flex items-start gap-3 bg-zinc-900/30 rounded-lg p-3">
              <span className="text-green-400 text-xl flex-shrink-0">✓</span>
              <span className="text-sm text-zinc-300">Be ready to justify your approach vs alternatives (microservices, caching, etc.)</span>
            </div>
            <div className="flex items-start gap-3 bg-zinc-900/30 rounded-lg p-3">
              <span className="text-green-400 text-xl flex-shrink-0">✓</span>
              <span className="text-sm text-zinc-300">Discuss identified risks and your mitigation strategies</span>
            </div>
          </div>
        </div>

      </div>

      <StepFooter projectId={projectId} currentStep="summary" canContinue={true} />
    </div>
  );
}
