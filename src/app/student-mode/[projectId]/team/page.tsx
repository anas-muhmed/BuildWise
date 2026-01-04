"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { distributeWork, DistributionResult } from "@/lib/student-mode/team-distributor";
import { TeamMember } from "@/lib/student-mode/team-types";

export default function TeamPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [result, setResult] = useState<DistributionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Fetch current architecture
        const archRes = await fetch(`/api/student-mode/materialize?projectId=${projectId}`);
        const architecture = await archRes.json();

        if (!architecture.nodes) {
          setLoading(false);
          return;
        }

        // MOCK TEAM (in real version, this would come from project context)
        const team: TeamMember[] = [
          { id: "1", name: "Safia", skills: ["backend", "devops"] },
          { id: "2", name: "Teammate A", skills: ["frontend"] },
          { id: "3", name: "Teammate B", skills: ["database"] },
        ];

        const distribution = distributeWork(architecture.nodes, team);
        setResult(distribution);
      } catch (err) {
        console.error("Failed to load team distribution:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading team distribution...
      </div>
    );
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        No architecture found. Complete the reasoning phase first.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Team Distribution</h1>
        <p className="text-zinc-400 mb-8">Component ownership and workload analysis</p>

        {/* Coverage Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-400">{result.coverage.assigned}</div>
            <div className="text-sm text-zinc-400">Assigned</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-400">{result.coverage.unassigned}</div>
            <div className="text-sm text-zinc-400">Unassigned</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
            <div className="text-2xl font-bold text-zinc-300">{result.coverage.total}</div>
            <div className="text-sm text-zinc-400">Total Components</div>
          </div>
        </div>

        {/* Warnings */}
        {result.warnings.length > 0 && (
          <div className="mb-8 bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="font-semibold text-red-400 mb-2">⚠ Warnings</div>
            <ul className="space-y-1">
              {result.warnings.map((warning, i) => (
                <li key={i} className="text-sm text-red-300">• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Assignments */}
        <div className="space-y-3">
          <h2 className="text-xl font-semibold mb-4">Component Assignments</h2>
          {result.assignments.map((assignment) => (
            <div
              key={assignment.nodeId}
              className={`p-4 rounded-lg border ${
                assignment.assignedTo
                  ? "bg-zinc-900 border-zinc-800"
                  : "bg-red-900/20 border-red-700"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-semibold text-lg">{assignment.nodeLabel}</div>
                  <div className="text-xs text-zinc-500 uppercase mt-1">
                    {assignment.nodeType} • Requires: {assignment.requiredSkill}
                  </div>
                </div>

                {assignment.assignedTo ? (
                  <div className="text-right">
                    <div className="text-green-400 font-semibold">
                      {assignment.assignedTo.name}
                    </div>
                    <div className="text-xs text-zinc-500">
                      Skills: {assignment.assignedTo.skills.join(", ")}
                    </div>
                  </div>
                ) : (
                  <div className="text-red-400 text-sm">
                    ⚠ {assignment.reason}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
