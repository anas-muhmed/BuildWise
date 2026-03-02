"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { scoreArchitecture, ArchitectureScore } from "@/lib/student-mode/score-engine";
import { generateReadinessReport } from "@/lib/backend/services/readinessAnalyzer";
import { loadDistributionResult } from "@/lib/student-mode/team-store";
import StepFooter from "@/components/student-mode/StepFooter";

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

// ─── Severity colors ──────────────────────────────────────────────────────────
const SEV: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  critical: { bg: "bg-red-900/20", border: "border-red-700/50", text: "text-red-300", icon: "🔴" },
  warning: { bg: "bg-amber-900/20", border: "border-amber-700/50", text: "text-amber-300", icon: "🟡" },
  info: { bg: "bg-blue-900/20", border: "border-blue-700/50", text: "text-blue-300", icon: "🔵" },
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SummaryPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();

  const [project, setProject] = useState<any>(null);
  const [reasoning, setReasoning] = useState<any>(null);
  const [architecture, setArchitecture] = useState<any>(null);
  const [score, setScore] = useState<ArchitectureScore | null>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [teamResult, setTeamResult] = useState<any>(null);
  const [buildScore, setBuildScore] = useState<number | null>(null);
  const [buildCount, setBuildCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [projRes, reasonRes] = await Promise.all([
          fetch(`/api/student-mode/define?projectId=${projectId}`),
          fetch(`/api/student-mode/reasoning?projectId=${projectId}`),
        ]);

        const projData = await projRes.json();
        const reasonData = await reasonRes.json();
        const answers = reasonData?.answers || {};

        setProject(projData);
        setReasoning(reasonData);

        // ── Load student's OWN build from localStorage ──────────────────────
        const { loadBuild } = await import("@/lib/student-mode/build-store");
        const { COMPONENTS, getRequirements, scoreBuild } = await import("@/lib/student-mode/component-catalog");
        const buildData = loadBuild(projectId);

        let archNodes: any[] = [];

        if (buildData?.selectedIds?.length) {
          // Student completed the build step — use their design
          setBuildScore(buildData.score);
          setBuildCount(buildData.selectedIds.length);

          archNodes = buildData.selectedIds.map((id: any) => {
            const comp = COMPONENTS.find((c: any) => c.id === id);
            const typeMap: Record<string, string> = {
              "web-frontend": "frontend", "mobile-app": "frontend",
              "api-server": "backend", "backend-worker": "backend",
              "microservices": "backend", "primary-db": "database",
              "read-replica": "database", "cache": "cache",
              "load-balancer": "load_balancer", "api-gateway": "backend",
              "cdn": "frontend", "object-storage": "backend",
              "message-queue": "queue", "auth-service": "backend",
              "waf": "backend", "monitoring": "backend",
            };
            return { id, label: comp?.name ?? id, type: typeMap[id] ?? "backend" };
          });

          // Validate the build with score engine
          const reqs = getRequirements(answers);
          const evalResult = scoreBuild(buildData.selectedIds, reqs);
          setBuildScore(evalResult.score);

          const archForScore = { nodes: archNodes, edges: [] };
          setArchitecture(archForScore);

          const archScore = scoreArchitecture({
            nodes: archNodes,
            edges: [],
            decisions: {
              backendType: buildData.selectedIds.includes("microservices") ? "microservices" : "monolith",
            },
            context: {
              teamSize: 3,
              experienceLevel: answers.team === "beginners" ? "beginner" : "intermediate",
            },
          });
          setScore(archScore);
        } else {
          // Fallback: AI-generated architecture
          const archRes = await fetch(`/api/student-mode/materialize?projectId=${projectId}`);
          const archResp = await archRes.json();
          const archData = archResp.architecture || archResp;
          setArchitecture(archData);
          archNodes = archData?.nodes || [];

          if (archNodes.length) {
            const archScore = scoreArchitecture({
              nodes: archNodes,
              edges: archData.edges || [],
              decisions: {
                backendType: archNodes.filter((n: any) => n.type === "backend").length > 1 ? "microservices" : "monolith",
              },
              context: { teamSize: 3, experienceLevel: answers.team === "beginners" ? "beginner" : "intermediate" },
            });
            setScore(archScore);
          }
        }

        // ── Run Readiness Analysis on the final node set ────────────────────
        if (archNodes.length) {
          const features: string[] = [];
          if (answers.data_sensitivity === "payments") features.push("payment");
          if (answers.realtime === "realtime") features.push("real-time", "websocket");
          if (answers.system_type === "communication") features.push("real-time");
          if (answers.user_load === "high_users") features.push("upload");

          const readinessReport = generateReadinessReport(archNodes, {
            features,
            traffic: answers.user_load === "high_users" ? "large"
              : answers.user_load === "medium_users" ? "medium" : "small",
          });
          setReadiness(readinessReport);
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
  const readPct = readiness ? readiness.overallScore : 0;
  const combined = Math.round((scorePct + readPct) / 2);
  const grade = getGrade(combined);
  const criticals = readiness?.checks?.filter((c: any) => c.severity === "critical") || [];
  const warnings = readiness?.checks?.filter((c: any) => c.severity === "warning") || [];
  const infos = readiness?.checks?.filter((c: any) => c.severity === "info") || [];

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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Overall Grade", value: grade.letter, sub: grade.label, color: grade.color },
            { label: "Design Score", value: `${scorePct}%`, sub: `${score?.total ?? 0}/${score?.maxTotal ?? 0} pts`, color: "#8b5cf6" },
            { label: "Readiness Score", value: `${readPct}%`, sub: `${readiness?.checks?.length ?? 0} checks run`, color: "#3b82f6" },
            { label: "Arch Components", value: architecture?.nodes?.length ?? 0, sub: `${architecture?.edges?.length ?? 0} connections`, color: "#10b981" },
          ].map((stat) => (
            <div key={stat.label} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-center hover:border-zinc-700 transition-all">
              <div className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
              <div className="text-xs text-zinc-600 mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Design Quality Score Breakdown ── */}
        {score && (
          <section className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6">
            <h2 className="font-semibold text-lg mb-6 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 text-xs">✦</span>
              Design Quality Scores
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ScoreBar label="Simplicity" score={score.breakdown.simplicity.score} max={score.breakdown.simplicity.max} reason={score.breakdown.simplicity.reason} color="#8b5cf6" />
              <ScoreBar label="Scalability" score={score.breakdown.scalability.score} max={score.breakdown.scalability.max} reason={score.breakdown.scalability.reason} color="#3b82f6" />
              <ScoreBar label="Maintainability" score={score.breakdown.maintainability.score} max={score.breakdown.maintainability.max} reason={score.breakdown.maintainability.reason} color="#10b981" />
              <ScoreBar label="Cost Efficiency" score={score.breakdown.cost.score} max={score.breakdown.cost.max} reason={score.breakdown.cost.reason} color="#f59e0b" />
            </div>
          </section>
        )}

        {/* ── Readiness Checks ── */}
        {readiness && (criticals.length > 0 || warnings.length > 0 || infos.length > 0) && (
          <section>
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 text-xs">⚡</span>
              Readiness Checks
              <span className="text-xs text-zinc-600 font-normal ml-1">({readiness.checks.length} issues found)</span>
            </h2>
            <div className="space-y-3">
              {[...criticals, ...warnings, ...infos].map((check: any) => {
                const s = SEV[check.severity] || SEV.info;
                return (
                  <div key={check.id} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">{s.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className={`font-semibold text-sm ${s.text}`}>{check.message}</div>
                        <div className="text-xs text-zinc-500 mt-1">💡 {check.resolution}</div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${s.border} ${s.text} shrink-0`}>
                        {check.severity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {readiness && criticals.length === 0 && warnings.length === 0 && (
          <div className="bg-emerald-900/20 border border-emerald-700/40 rounded-2xl p-5 flex items-center gap-4">
            <span className="text-3xl">✅</span>
            <div>
              <div className="font-semibold text-emerald-400">No critical issues found!</div>
              <div className="text-sm text-zinc-400">Your architecture passes all key readiness checks.</div>
            </div>
          </div>
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
                  {teamResult.assignments?.reduce((s: number, a: any) => s + a.assignedTasks.length, 0) ?? 0}
                </div>
                <div className="text-xs text-zinc-500 mt-1">Tasks Distributed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-400">
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
            {criticals.length > 0 && (
              <p>⚠ There {criticals.length === 1 ? "is" : "are"} <strong className="text-red-400">{criticals.length} critical issue{criticals.length > 1 ? "s" : ""}</strong> that should be resolved before deployment.</p>
            )}
            {warnings.length > 0 && (
              <p>🟡 <strong className="text-amber-400">{warnings.length} warning{warnings.length > 1 ? "s" : ""}</strong> were found that are worth addressing in a production system.</p>
            )}
            {criticals.length === 0 && warnings.length === 0 && (
              <p>✅ No critical or warning-level issues detected. Your design follows solid architectural principles.</p>
            )}
            <p className="text-zinc-600 text-xs pt-2 border-t border-zinc-800">
              Evaluation powered by BuildWise's rule-based readiness analyzer + architecture scoring engine. No AI involved in this step — pure algorithmic analysis.
            </p>
          </div>
        </section>

      </div>

      <StepFooter projectId={projectId} currentStep="summary" canContinue={true} />
    </div>
  );
}
