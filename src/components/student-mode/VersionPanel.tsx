"use client";

import { useState, useEffect } from "react";

export default function VersionPanel({
  projectId,
  onLoad,
}: {
  projectId: string;
  onLoad: (data: any) => void;
}) {
  const [versions, setVersions] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedA, setSelectedA] = useState<string | null>(null);
  const [selectedB, setSelectedB] = useState<string | null>(null);
  const [comparison, setComparison] = useState<any>(null);

  useEffect(() => {
    fetchVersions();
  }, [projectId]);

  const fetchVersions = async () => {
    try {
      const res = await fetch(`/api/student-mode/version/list?projectId=${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setVersions(data);
      }
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    }
  };

  const saveVersion = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/student-mode/version/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId })
      });

      if (res.ok) {
        await fetchVersions();
      }
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setSaving(false);
    }
  };

  const loadVersion = async (designId: string) => {
    setLoading(designId);
    try {
      const res = await fetch("/api/student-mode/version/load", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, designId })
      });

      if (res.ok) {
        const data = await res.json();
        onLoad(data);
      }
    } catch (err) {
      console.error("Load failed:", err);
    } finally {
      setLoading(null);
    }
  };

  const compareVersions = async () => {
    if (!selectedA || !selectedB) return;

    try {
      const res = await fetch("/api/student-mode/version/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          versionAId: selectedA,
          versionBId: selectedB,
        })
      });

      if (res.ok) {
        const data = await res.json();
        setComparison(data);
      }
    } catch (err) {
      console.error("Compare failed:", err);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-zinc-200 flex items-center gap-2">
          <span>💾</span>
          <span>Versions</span>
        </h3>
        <div className="flex gap-2">
          {versions.length >= 2 && (
            <button
              onClick={() => {
                setCompareMode(!compareMode);
                setComparison(null);
                setSelectedA(null);
                setSelectedB(null);
              }}
              className="px-3 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-sm transition"
            >
              {compareMode ? "Cancel" : "Compare"}
            </button>
          )}
          <button
            onClick={saveVersion}
            disabled={saving}
            className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {versions.length === 0 ? (
        <p className="text-xs text-zinc-500">No saved versions yet</p>
      ) : (
        <>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {versions.map((v) => {
              const isSelectedA = compareMode && selectedA === v.id;
              const isSelectedB = compareMode && selectedB === v.id;
              const isSelected = isSelectedA || isSelectedB;

              return (
                <div
                  key={v.id}
                  onClick={() => {
                    if (compareMode) {
                      if (!selectedA) setSelectedA(v.id);
                      else if (!selectedB && v.id !== selectedA) setSelectedB(v.id);
                      else {
                        setSelectedA(v.id);
                        setSelectedB(null);
                      }
                    }
                  }}
                  className={`bg-zinc-800 rounded p-2 flex items-center justify-between transition ${
                    compareMode ? "cursor-pointer hover:bg-zinc-700" : ""
                  } ${
                    isSelectedA ? "ring-2 ring-green-500" : isSelectedB ? "ring-2 ring-blue-500" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {isSelectedA && <span className="text-xs text-green-400">A</span>}
                      {isSelectedB && <span className="text-xs text-blue-400">B</span>}
                      <div className="text-sm text-zinc-300">{formatTimestamp(v.timestamp)}</div>
                    </div>
                    <div className="text-xs text-zinc-500">
                      {v.decisions.length} decisions • Score: {v.score}
                    </div>
                  </div>
                  {!compareMode && (
                    <button
                      onClick={() => loadVersion(v.id)}
                      disabled={loading === v.id}
                      className="ml-2 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 rounded text-xs transition disabled:opacity-50"
                    >
                      {loading === v.id ? "..." : "Load"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {compareMode && selectedA && selectedB && (
            <button
              onClick={compareVersions}
              className="mt-3 w-full px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded text-sm transition"
            >
              Compare A vs B
            </button>
          )}

          {comparison && (
            <div className="mt-3 bg-zinc-800 border border-zinc-700 rounded p-3 space-y-2">
              <div className="text-sm font-semibold text-zinc-200">Comparison Result</div>
              <div className="text-xs text-zinc-300">{comparison.explanation}</div>
              
              {comparison.addedDecisions.length > 0 && (
                <div className="text-xs">
                  <span className="text-green-400">+ Added: </span>
                  <span className="text-zinc-400">{comparison.addedDecisions.length} decisions</span>
                </div>
              )}
              
              {comparison.removedDecisions.length > 0 && (
                <div className="text-xs">
                  <span className="text-red-400">- Removed: </span>
                  <span className="text-zinc-400">{comparison.removedDecisions.length} decisions</span>
                </div>
              )}
              
              <div className="text-xs">
                <span className="text-zinc-400">Score Delta: </span>
                <span className={comparison.scoreDelta > 0 ? "text-green-400" : comparison.scoreDelta < 0 ? "text-red-400" : "text-zinc-400"}>
                  {comparison.scoreDelta > 0 ? "+" : ""}{comparison.scoreDelta}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
