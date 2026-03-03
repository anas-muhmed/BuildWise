"use client";

import { useParams, useRouter } from "next/navigation";
import { useRequireAuth } from "@/lib/useRequireAuth";

export default function StudentModeSetup() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useRequireAuth();

  if (isLoading) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAuthenticated) return null;

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
            {[
              { label: "Define Project", desc: "Name, goal, scale, and data sensitivity" },
              { label: "Answer Design Questions", desc: "7 questions that constraint your architecture" },
              { label: "Design Your Architecture", desc: "Pick components — algorithm enforces your requirements" },
              { label: "Architecture Diagram", desc: "See your design visualised as a professional diagram" },
              { label: "Architecture Review", desc: "Defend your choices — resolve algorithm-detected issues" },
              { label: "Team Setup", desc: "Add your team — greedy algorithm distributes tasks by skill" },
              { label: "Cost Analysis", desc: "Per-component cloud pricing of YOUR design" },
              { label: "Summary & Grade", desc: "Full report card with letter grade — ready for viva" },
              { label: "Execution Blueprint", desc: "Week-by-week build plan based on your architecture" },
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-4 group hover:translate-x-2 transition-transform">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-purple-400 font-bold flex-shrink-0">{i + 1}</span>
                <div>
                  <div className="text-zinc-300 group-hover:text-white transition-colors font-medium">{step.label}</div>
                  <div className="text-xs text-zinc-500">{step.desc}</div>
                </div>
              </li>
            ))}
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
