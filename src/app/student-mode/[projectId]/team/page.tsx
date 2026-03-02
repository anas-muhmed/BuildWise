"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { loadDistributionResult, loadTeamSetup, ALL_SKILLS } from "@/lib/student-mode/team-store";
import StepFooter from "@/components/student-mode/StepFooter";

// Types from distributeTeamHours output
type AssignedTask = { id: string; title: string; estimatedHours: number };

type MemberResult = {
  userId: string;
  name: string;
  primaryRole: string;
  score: number;
  assignedTasks: AssignedTask[];
  assignedHours: number;
  capacity: number;
  overloaded?: boolean;
  skill_gap?: boolean;
  rescued?: boolean;    // Got tasks via Phase 4 idle rescue
  rebalanced?: boolean; // Got tasks via Phase 5 overload leveling
};

type DistributionResult = {
  assignments: MemberResult[];
  warnings: string[];
};

function CapacityBar({ used, total }: { used: number; total: number }) {
  const pct = Math.min(100, total > 0 ? Math.round((used / total) * 100) : 0);
  const color =
    pct >= 100 ? "#ef4444" : pct >= 80 ? "#f59e0b" : "#10b981";
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-zinc-500 mb-1">
        <span>Hours used</span>
        <span style={{ color }}>
          {used}h / {total}h ({pct}%)
        </span>
      </div>
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function TeamResultsPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const [result, setResult] = useState<DistributionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = loadDistributionResult(projectId);
    if (stored) {
      setResult(stored);
    }
    setLoading(false);
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading distribution results...</div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-6 p-8">
        <div className="text-center">
          <div className="text-5xl mb-4">👥</div>
          <h2 className="text-2xl font-bold mb-2">No distribution found</h2>
          <p className="text-zinc-400 mb-6">
            Complete the Team Setup step first to define your team and run the algorithm.
          </p>
          <button
            onClick={() => router.push(`/student-mode/${projectId}/team-setup`)}
            className="px-6 py-3 bg-violet-600 hover:bg-violet-500 rounded-xl font-semibold transition-all"
          >
            ← Go to Team Setup
          </button>
        </div>
      </div>
    );
  }

  const { assignments, warnings } = result;
  const totalTasks = assignments.reduce((s, a) => s + a.assignedTasks.length, 0);
  const totalHours = assignments.reduce((s, a) => s + a.assignedHours, 0);
  const overloadedCount = assignments.filter(a => a.overloaded).length;
  const skillGapCount = assignments.filter(a => a.skill_gap).length;

  return (
    <div className="min-h-screen bg-black text-white pb-32">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-black/90 backdrop-blur-xl border-b border-zinc-800 px-8 py-5">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-sky-400 bg-clip-text text-transparent">
              Team Distribution Results
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Greedy best-fit · skill scoring · capacity-aware
            </p>
          </div>
          <button
            onClick={() => router.push(`/student-mode/${projectId}/team-setup`)}
            className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-700 hover:border-zinc-500 px-3 py-2 rounded-lg transition-all"
          >
            ← Re-configure team
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 pt-8 space-y-8">

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Team Members", value: assignments.length, color: "text-violet-400" },
            { label: "Total Tasks", value: totalTasks, color: "text-sky-400" },
            { label: "Total Hours", value: `${totalHours}h`, color: "text-emerald-400" },
            { label: "Overloaded", value: overloadedCount, color: overloadedCount > 0 ? "text-red-400" : "text-zinc-500" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-center hover:border-zinc-700 transition-all"
            >
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Warnings ── */}
        {warnings.length > 0 && (
          <div className="bg-amber-900/20 border border-amber-700/50 rounded-2xl p-5">
            <div className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
              <span>⚠</span> Distribution Warnings
            </div>
            <ul className="space-y-1.5">
              {warnings.map((w, i) => (
                <li key={i} className="text-sm text-amber-200/80 flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── Skill Gap alert ── */}
        {skillGapCount > 0 && (
          <div className="bg-red-900/20 border border-red-700/50 rounded-2xl p-5">
            <div className="font-semibold text-red-400 mb-1 flex items-center gap-2">
              <span>🔴</span> Skill Gaps Detected
            </div>
            <p className="text-sm text-red-200/70">
              {skillGapCount} member{skillGapCount > 1 ? "s are" : " is"} assigned to roles outside their skillset. Consider adding members with the missing skills.
            </p>
          </div>
        )}

        {/* ── Member Cards ── */}
        <div>
          <h2 className="text-lg font-semibold mb-4 text-zinc-300">Member Assignments</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {assignments.map((member) => {
              const initials = member.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
              return (
                <div
                  key={member.userId}
                  className={`bg-zinc-900/60 border rounded-2xl p-6 transition-all hover:scale-[1.01] ${member.overloaded
                    ? "border-red-500/40 hover:border-red-500/60"
                    : "border-zinc-800 hover:border-emerald-500/30"
                    }`}
                >
                  {/* Card Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600 to-sky-600 flex items-center justify-center font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-lg">{member.name}</span>
                        {member.overloaded && (
                          <span className="text-xs bg-red-900/40 text-red-400 border border-red-700/50 px-2 py-0.5 rounded-full">
                            ⚠ Overloaded
                          </span>
                        )}
                        {member.skill_gap && (
                          <span className="text-xs bg-amber-900/40 text-amber-400 border border-amber-700/50 px-2 py-0.5 rounded-full">
                            Skill Gap
                          </span>
                        )}
                        {member.rescued && (
                          <span className="text-xs bg-violet-900/40 text-violet-400 border border-violet-700/50 px-2 py-0.5 rounded-full">
                            🛟 Rescued
                          </span>
                        )}
                        {member.rebalanced && (
                          <span className="text-xs bg-sky-900/40 text-sky-400 border border-sky-700/50 px-2 py-0.5 rounded-full">
                            ↔ Rebalanced
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-sky-400 mt-0.5">{member.primaryRole}</div>
                      <div className="text-xs text-zinc-600">Score: {member.score}</div>
                    </div>
                  </div>

                  {/* Tasks */}
                  <div className="mb-2">
                    <div className="text-xs text-zinc-500 uppercase tracking-wide mb-2">
                      Assigned Tasks ({member.assignedTasks.length})
                    </div>
                    {member.assignedTasks.length === 0 ? (
                      <p className="text-xs text-zinc-600 italic">No tasks assigned</p>
                    ) : (
                      <div className="space-y-1.5">
                        {member.assignedTasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between bg-zinc-800/60 rounded-lg px-3 py-2"
                          >
                            <span className="text-sm text-zinc-300 truncate mr-2">{task.title}</span>
                            <span className="text-xs text-emerald-500 shrink-0 font-semibold">{task.estimatedHours}h</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Capacity Bar */}
                  <CapacityBar used={member.assignedHours} total={member.capacity} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Algorithm Explanation ── */}
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-6 text-sm text-zinc-500 space-y-2">
          <div className="font-semibold text-zinc-400 mb-2">How the algorithm works (5 phases)</div>
          <p><span className="text-violet-400 font-semibold">Phase 1</span> — Skill Scoring: each member is scored per role as <span className="text-zinc-300">(matching skills) + capacity bonus</span>.</p>
          <p><span className="text-violet-400 font-semibold">Phase 2</span> — Role Assignment: every member maps to best role. Zero-skill members still get assigned via capacity tiebreak.</p>
          <p><span className="text-violet-400 font-semibold">Phase 3</span> — Greedy Largest-First Packing: tasks sorted by hours (desc) and assigned to the member with <span className="text-zinc-300">most remaining capacity</span>.</p>
          <p><span className="text-violet-400 font-semibold">Phase 4</span> — <span className="text-violet-300">Idle Rescue</span>: members with 0 tasks steal the smallest task from the most overloaded member. <span className="text-zinc-300">No one is left idle.</span></p>
          <p><span className="text-violet-400 font-semibold">Phase 5</span> — Overload Leveling: if anyone exceeds 150% capacity and another is under 50%, the smallest excess task moves over.</p>
        </div>

      </div>

      <StepFooter projectId={projectId} currentStep="team" canContinue={true} />
    </div>
  );
}
