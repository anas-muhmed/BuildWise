"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { loadDistributionResult } from "@/lib/student-mode/team-store";
import StepFooter from "@/components/student-mode/StepFooter";
import AIStatusBadge from "@/components/student-mode/AIStatusBadge";

// ─── Grade calculation ────────────────────────────────────────────────────────
function getGrade(pct: number): { letter: string; color: string; label: string } {
  if (pct >= 90) return { letter: "A+", color: "#10b981", label: "Excellent" };
  if (pct >= 80) return { letter: "A", color: "#10b981", label: "Very Good" };
  if (pct >= 70) return { letter: "B", color: "#3b82f6", label: "Good" };
  if (pct >= 60) return { letter: "C", color: "#f59e0b", label: "Satisfactory" };
  if (pct >= 50) return { letter: "D", color: "#f97316", label: "Needs Work" };
  return { letter: "F", color: "#ef4444", label: "Critical Issues" };
}

// ─── Score bar component ──────────────────────────────────────────────────────
function ScoreBar({
  label, score, max, reason, color,
}: { label: string; score: number; max: number; reason: string; color: string }) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium text-zinc-300">{label}</span>
        <span style={{ color }} className="font-bold tabular-nums">{score}/{max}</span>
      </div>
      <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <p className="text-xs text-zinc-600">{reason}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SummaryPage() {
  const { projectId } = useParams<{ projectId: string }>();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reasoning, setReasoning] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [architecture, setArchitecture] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [score, setScore] = useState<any>(null);
  const [source, setSource] = useState<"ai" | "mock">("mock");
  const [decisions, setDecisions] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [teamResult, setTeamResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [reasonRes, archRes, scoreRes] = await Promise.all([
          fetch(`/api/student-mode/reasoning?projectId=${projectId}`),
          fetch(`/api/student-mode/materialize?projectId=${projectId}`),
          fetch(`/api/student-mode/score?projectId=${projectId}`),
        ]);

        const reasonData = await reasonRes.json();
        const archData = await archRes.json();
        const scoreData = await scoreRes.json();

        setReasoning(reasonData);
        setArchitecture(archData.architecture || archData);
        setScore(scoreData);
        setSource(scoreData.source || "mock");

        // Get design decisions from localStorage (canvas decisions)
        try {
          const stored = localStorage.getItem(`student-arch-state-${projectId}`);
          if (stored) {
            const state = JSON.parse(stored);
            setDecisions(state.activeDecisions || []);
          }
        } catch {
          console.warn("Failed to load decisions from localStorage");
        }

        // ── Load Team Result ────────────────────────────────────────────────
        const td = loadDistributionResult(projectId);
        setTeamResult(td);
      } catch (err) {
        console.error("Failed to load summary:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [projectId]);


  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-zinc-400">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          Generating report card...
        </div>
      </div>
    );
  }

  // ── Derived values ──────────────────────────────────────────────────────────
  const scorePct = score ? Math.round((score.total / score.maxTotal) * 100) : 0;
  const combined = scorePct; // Grade based on AI score only, not re-validation
  const grade = getGrade(scorePct);
  const nodeCount = architecture?.nodes?.length || 0;

  // Get base architecture for evolution display
  const getBaseNodeCount = () => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(`student-arch-state-${projectId}`) : null;
      if (stored) {
        const state = JSON.parse(stored);
        return state.baseArchitecture?.nodes?.length || nodeCount;
      }
    } catch {}
    return nodeCount;
  };
  const baseNodeCount = getBaseNodeCount();

  // Decision labels for display
  const DECISION_LABELS: Record<string, { label: string; icon: string }> = {
    ADD_CACHE: { label: "Added Caching Layer", icon: "🗄️" },
    ADD_QUEUE: { label: "Added Message Queue", icon: "📬" },
    USE_MICROSERVICES: { label: "Switched to Microservices", icon: "🔷" },
    ADD_READ_REPLICA: { label: "Added Read Replica", icon: "📖" },
  };

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* ── Sticky header ── */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-zinc-800 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Architecture Report Card
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Algorithmic evaluation of your design decisions
            </p>
          </div>
          {/* Overall Grade Badge */}
          <div
            className="flex flex-col items-center justify-center w-20 h-20 rounded-2xl border-2 font-black text-4xl"
            style={{ borderColor: grade.color, color: grade.color, backgroundColor: grade.color + "15" }}
          >
            {grade.letter}
            <span className="text-xs font-normal mt-0.5" style={{ color: grade.color }}>
              {combined}%
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pt-8 space-y-8">

        {/* ── Overall Summary Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: "Overall Grade", value: grade.letter, sub: grade.label, color: grade.color },
            { label: "Design Score", value: `${scorePct}%`, sub: `${score?.total ?? 0}/${score?.maxTotal ?? 0} pts`, color: "#8b5cf6" },
            { label: "Architecture", value: architecture?.nodes?.length ?? 0, sub: `${architecture?.edges?.length ?? 0} connections`, color: "#10b981" },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-center hover:border-zinc-700 transition-all">
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
              <div className="text-xs text-zinc-600 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Your Journey ── */}
        <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 text-xs">🚀</span>
            Your Design Journey
          </h2>
          <div className="space-y-5">
            {/* Starting Point */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold shrink-0">1</div>
              <div className="flex-1">
                <div className="font-semibold text-blue-300">Initial Architecture</div>
                <div className="text-sm text-zinc-400 mt-1">Generated {baseNodeCount} components based on your requirements</div>
              </div>
            </div>

            {/* Design Decisions */}
            {decisions.length > 0 && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 font-bold shrink-0">2</div>
                <div className="flex-1">
                  <div className="font-semibold text-violet-300">Design Decisions</div>
                  <div className="text-sm text-zinc-400 mt-1">Made {decisions.length} architectural improvement{decisions.length > 1 ? 's' : ''}:</div>
                  <div className="mt-2 space-y-1.5">
                    {decisions.map((decisionId) => {
                      const decision = DECISION_LABELS[decisionId];
                      if (!decision) return null;
                      return (
                        <div key={decisionId} className="flex items-center gap-2 text-sm">
                          <span className="text-lg">{decision.icon}</span>
                          <span className="text-zinc-300">{decision.label}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Final Architecture */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold shrink-0">3</div>
              <div className="flex-1">
                <div className="font-semibold text-emerald-300">Final Architecture</div>
                <div className="text-sm text-zinc-400 mt-1">
                  {nodeCount > baseNodeCount 
                    ? `Evolved to ${nodeCount} components (+${nodeCount - baseNodeCount} from decisions)`
                    : `Refined to ${nodeCount} components`
                  }
                </div>
              </div>
            </div>

            {/* AI Evaluation */}
            {score && (
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-amber-600/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold shrink-0">✓</div>
                <div className="flex-1">
                  <div className="font-semibold text-amber-300">AI Evaluation</div>
                  <div className="text-sm text-zinc-400 mt-1">{score.summary}</div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Design Quality Score Breakdown ── */}
        {score && (
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 text-xs">✦</span>
              Design Quality Scores
              <AIStatusBadge source={source} />
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScoreBar label="Simplicity" score={score.breakdown.simplicity.score} max={score.breakdown.simplicity.max} reason={score.breakdown.simplicity.reason} color="#8b5cf6" />
              <ScoreBar label="Scalability" score={score.breakdown.scalability.score} max={score.breakdown.scalability.max} reason={score.breakdown.scalability.reason} color="#3b82f6" />
              <ScoreBar label="Maintainability" score={score.breakdown.maintainability.score} max={score.breakdown.maintainability.max} reason={score.breakdown.maintainability.reason} color="#10b981" />
              <ScoreBar label="Cost Efficiency" score={score.breakdown.cost.score} max={score.breakdown.cost.max} reason={score.breakdown.cost.reason} color="#f59e0b" />
            </div>
          </section>
        )}



        {/* ── Team Distribution Summary ── */}
        {teamResult && (
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-xs">👥</span>
              Team Distribution Summary
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">{teamResult.assignments?.length ?? 0}</div>
                <div className="text-xs text-zinc-500 mt-1">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-sky-400">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {teamResult.assignments?.reduce((s: number, a: any) => s + a.assignedTasks.length, 0) ?? 0}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Tasks Distributed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {teamResult.assignments?.filter((a: any) => a.overloaded).length ?? 0}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Overloaded</div>
              </div>
            </div>
            {teamResult.warnings?.length > 0 && (
              <div className="mt-4 text-xs text-zinc-500 space-y-1">
                {teamResult.warnings.slice(0, 3).map((w: string, i: number) => (
                  <div key={i}>• {w}</div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── Key Design Decisions ── */}
        {reasoning?.answers && (
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-sky-600/20 border border-sky-500/40 flex items-center justify-center text-sky-400 text-xs">📋</span>
              Your Design Decisions
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {Object.entries(reasoning.answers).map(([key, value]: [string, any]) => (
                <div key={key} className="bg-zinc-800/40 rounded-xl p-3 border-l-2 border-violet-500/50">
                  <div className="text-xs text-zinc-500 uppercase tracking-wide mb-1">
                    {key.replace(/_/g, " ")}
                  </div>
                  <div className="font-medium text-white capitalize">
                    {value?.toString().replace(/_/g, " ") || "N/A"}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── What This Means ── */}
        <section className="bg-gradient-to-br from-violet-900/20 to-blue-900/20 border border-violet-700/30 rounded-2xl p-6">
          <h2 className="font-semibold text-lg mb-4 text-violet-300 flex items-center gap-2">
            🎓 What This Evaluation Means
          </h2>
          <div className="space-y-3 text-sm text-zinc-400">
            <p>
              Your architecture received a <strong style={{ color: grade.color }}>{grade.letter} ({combined}%)</strong> —
              {" "}<span className="text-zinc-300">{grade.label}</span>.
            </p>
            {scorePct >= 70 && (
              <p>✅ Your design demonstrates solid architectural principles and aligns well with your stated requirements.</p>
            )}
            {scorePct >= 50 && scorePct < 70 && (
              <p>💡 Your architecture has a good foundation. Consider the feedback above to further strengthen your design.</p>
            )}
            {scorePct < 50 && (
              <p>⚠ There&apos;s room for improvement. Review the AI feedback to better align your architecture with your project requirements.</p>
            )}
            <p className="text-zinc-600 text-xs pt-2 border-t border-zinc-800">
              Design scores powered by AI (GPT-4-turbo) evaluating how well your architecture matches your stated requirements.
            </p>
          </div>
        </section>

      </div>

      <StepFooter projectId={projectId} currentStep="summary" canContinue={true} />
    </div>
  );
}
