"use client";

import { useState, useEffect } from "react";

const DECISIONS = [
  { id: "ADD_CACHE", label: "Cache", icon: "🗄️" },
  { id: "ADD_QUEUE", label: "Queue", icon: "📬" },
  { id: "USE_MICROSERVICES", label: "Microservices", icon: "🔷" },
  { id: "ADD_READ_REPLICA", label: "Read Replica", icon: "📖" }
];

export default function DecisionPanel({
  projectId,
  onUpdate,
}: {
  projectId: string;
  onUpdate: (data: any) => void;
}) {
  const [toggling, setToggling] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<any>(null);
  const [activeDecisions, setActiveDecisions] = useState<string[]>([]);

  // Fetch active decisions on mount
  useEffect(() => {
    fetch(`/api/student-mode/decision-toggle?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => setActiveDecisions(data.activeDecisions || []))
      .catch(() => setActiveDecisions([]));
  }, [projectId]);

  const toggle = async (decisionId: string) => {
    setToggling(decisionId);
    setLastResult(null);

    try {
      const res = await fetch("/api/student-mode/decision-toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, decisionId })
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Toggle failed:", text);
        return;
      }

      const text = await res.text();
      if (!text) {
        console.error("Empty response from toggle API");
        return;
      }

      const data = JSON.parse(text);
      setLastResult(data);
      setActiveDecisions(data.activeDecisions || []);
      onUpdate(data);
    } catch (err) {
      console.error("Toggle error:", err);
    } finally {
      setToggling(null);
    }
  };

  const undo = async () => {
    if (activeDecisions.length === 0) return;

    try {
      const res = await fetch("/api/student-mode/decision-undo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Undo failed:", text);
        return;
      }

      const text = await res.text();
      if (!text) {
        console.error("Empty response from undo API");
        return;
      }

      const data = JSON.parse(text);
      setActiveDecisions(data.activeDecisions || []);
      setLastResult({ explanation: data.message, scoreDelta: 0 });
      onUpdate(data);
    } catch (err) {
      console.error("Undo error:", err);
    }
  };

  const reset = async () => {
    if (activeDecisions.length === 0) return;

    try {
      const res = await fetch("/api/student-mode/decision-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Reset failed:", text);
        return;
      }

      const text = await res.text();
      if (!text) {
        console.error("Empty response from reset API");
        return;
      }

      const data = JSON.parse(text);
      setActiveDecisions(data.activeDecisions || []);
      setLastResult({ explanation: data.message, scoreDelta: 0 });
      onUpdate(data);
    } catch (err) {
      console.error("Reset error:", err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <h3 className="font-semibold text-zinc-200 mb-3 flex items-center gap-2">
          <span>⚡</span>
          <span>Design Decisions</span>
        </h3>

        <div className="space-y-2">
          {DECISIONS.map(d => {
            const isActive = activeDecisions.includes(d.id);
            return (
              <button
                key={d.id}
                onClick={() => toggle(d.id)}
                disabled={toggling === d.id}
                className={`w-full text-left px-3 py-2 rounded transition flex items-center gap-2 disabled:opacity-50 ${
                  isActive
                    ? "bg-indigo-900 border border-indigo-600 text-indigo-200"
                    : "bg-zinc-800 hover:bg-zinc-700"
                }`}
              >
                <span>{d.icon}</span>
                <span className="text-sm flex-1">
                  {isActive ? `Remove ${d.label}` : `Add ${d.label}`}
                </span>
                {toggling === d.id && (
                  <span className="text-xs text-zinc-500">...</span>
                )}
                {isActive && (
                  <span className="text-xs text-indigo-400">✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* History Controls */}
        {activeDecisions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-800 flex gap-2">
            <button
              onClick={undo}
              className="flex-1 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition flex items-center justify-center gap-2"
            >
              <span>↶</span>
              <span>Undo Last</span>
            </button>
            <button
              onClick={reset}
              className="flex-1 px-3 py-2 bg-red-900/30 hover:bg-red-900/50 border border-red-700 rounded text-sm transition flex items-center justify-center gap-2 text-red-300"
            >
              <span>↺</span>
              <span>Reset All</span>
            </button>
          </div>
        )}
      </div>

      {lastResult && (
        <div className="bg-indigo-950 border border-indigo-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-indigo-400 font-semibold">Impact</span>
            <span className={`text-sm ${lastResult.scoreDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {lastResult.scoreDelta > 0 ? '+' : ''}{lastResult.scoreDelta} points
            </span>
          </div>
          <p className="text-xs text-zinc-300">{lastResult.explanation}</p>
        </div>
      )}
    </div>
  );
}
