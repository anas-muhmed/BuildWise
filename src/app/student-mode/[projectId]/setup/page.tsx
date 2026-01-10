"use client";

import { useParams, useRouter } from "next/navigation";

export default function StudentModeSetup() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-3xl text-center space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-3xl"></div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent relative">
            Student Mode
          </h1>
        </div>
        <p className="text-xl text-zinc-400">
          Design Reasoning Simulator — Build Interview-Ready Architecture
        </p>

        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-zinc-700/50 rounded-xl p-8 text-left space-y-6 shadow-2xl">
          <h2 className="text-xl font-semibold text-white">Your Journey:</h2>
          <ol className="space-y-4 text-sm">
            <li className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">1</span>
              <div>
                <div className="text-zinc-300 group-hover:text-white transition-colors font-medium">Define Project</div>
                <div className="text-xs text-zinc-500">Name, goal, and target audience</div>
              </div>
            </li>
            <li className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">2</span>
              <div>
                <div className="text-zinc-300 group-hover:text-white transition-colors font-medium">Answer Design Questions</div>
                <div className="text-xs text-zinc-500">7 questions to guide architecture decisions</div>
              </div>
            </li>
            <li className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">3</span>
              <div>
                <div className="text-zinc-300 group-hover:text-white transition-colors font-medium">Explore Architecture Canvas</div>
                <div className="text-xs text-zinc-500">Visual system with interactive explanations</div>
              </div>
            </li>
            <li className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">4</span>
              <div>
                <div className="text-zinc-300 group-hover:text-white transition-colors font-medium">Team Distribution</div>
                <div className="text-xs text-zinc-500">Who builds what - execution planning</div>
              </div>
            </li>
            <li className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">5</span>
              <div>
                <div className="text-zinc-300 group-hover:text-white transition-colors font-medium">Cost & Tradeoff Analysis</div>
                <div className="text-xs text-zinc-500">Evaluate engineering maturity and decisions</div>
              </div>
            </li>
            <li className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">6</span>
              <div>
                <div className="text-zinc-300 group-hover:text-white transition-colors font-medium">Execution Blueprint</div>
                <div className="text-xs text-zinc-500">Step-by-step development plan</div>
              </div>
            </li>
            <li className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">7</span>
              <div>
                <div className="text-zinc-300 group-hover:text-white transition-colors font-medium">Complete Summary</div>
                <div className="text-xs text-zinc-500">Full breakdown ready for viva defense</div>
              </div>
            </li>
          </ol>
        </div>

        <button
          onClick={() => router.push(`/student-mode/${projectId}/define`)}
          className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-xl text-lg font-semibold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 transform hover:scale-105"
        >
          <span className="relative z-10">Start Project Setup →</span>
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 to-blue-400 opacity-0 group-hover:opacity-20 blur transition-opacity"></div>
        </button>
      </div>
    </div>
  );
}
