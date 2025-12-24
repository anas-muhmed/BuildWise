"use client";
import React, { useState } from "react";
import * as api from "@/lib/frontend/api";

/**
 * Minimal test UI for team distribution.
 * Usage: include <TeamDistributor projectId="..." />
 *
 * Roster JSON example:
 * [
 *  { "userId": "u1", "name": "Alice", "skills": ["react","node"], "capacity": 20 },
 *  { "userId": "u2", "name": "Bob", "skills": ["sql","node"], "capacity": 15 }
 * ]
 */

export default function TeamDistributor({ projectId }: { projectId: string }) {
  const [rosterText, setRosterText] = useState(`[
  { "userId": "u1", "name": "Alice", "skills": ["react","node"], "capacity": 20 },
  { "userId": "u2", "name": "Bob", "skills": ["sql","node"], "capacity": 15 },
  { "userId": "u3", "name": "Cathy", "skills": ["devops"], "capacity": 10 }
]`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    try {
      const roster = JSON.parse(rosterText);
      const token = typeof window !== "undefined" ? localStorage.getItem("token") || undefined : undefined;
      const resp = await api.distributeTeam(projectId, roster, {}, token);
      if (!resp.ok) alert("Error: " + (resp.error || "unknown"));
      setResult(resp.result || null);
    } catch (e) {
      alert("Invalid JSON: " + (e instanceof Error ? e.message : "unknown"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-zinc-900 border border-zinc-800 rounded">
      <h3 className="text-white text-lg">Team Distributor</h3>
      <textarea value={rosterText} onChange={e => setRosterText(e.target.value)} className="w-full h-40 p-2 bg-zinc-800 border border-zinc-700 text-sm text-zinc-200 rounded" />
      <div className="flex gap-2">
        <button onClick={run} disabled={loading} className="px-3 py-2 rounded bg-indigo-600 text-white">{loading ? "Running..." : "Distribute"}</button>
      </div>

      {result && (
        <div className="mt-2">
          <h4 className="text-sm text-zinc-300">Warnings</h4>
          <ul className="text-xs text-zinc-400">
            {(result.warnings || []).map((w: string, i: number) => <li key={i}>• {w}</li>)}
          </ul>

          <h4 className="text-sm mt-3 text-zinc-300">Assignments</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {(result.assignments || []).map((a: any) => (
              <div key={a.userId} className="p-3 bg-zinc-800 border border-zinc-700 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white font-medium">{a.name}</div>
                    <div className="text-xs text-zinc-400">{a.primaryRole} • score: {a.score}</div>
                  </div>
                  {a.skill_gap && <div className="text-xs text-yellow-300 px-2 py-1 rounded bg-yellow-900/20">Skill gap</div>}
                </div>
                <div className="mt-2 text-xs text-zinc-300">
                  <div className="font-medium mb-1">Tasks</div>
                  {a.assignedTasks && a.assignedTasks.length ? (
                    <ul className="list-disc list-inside">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {a.assignedTasks.map((t: any) => <li key={t.id}>{t.title}</li>)}
                    </ul>
                  ) : <div className="text-xs text-zinc-500">No tasks assigned</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
