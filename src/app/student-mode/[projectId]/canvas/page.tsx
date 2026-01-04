"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { projectToCanvas } from "@/lib/student-mode/canvas-layout";
import { explainNode } from "@/lib/student-mode/explain";
import { explainEdge } from "@/lib/student-mode/explain-edge";
import NodeExplain from "@/components/student-mode/NodeExplain";
import BackendDecision from "@/components/student-mode/BackendDecision";
import DecisionPanel from "@/components/student-mode/DecisionPanel";
import VersionPanel from "@/components/student-mode/VersionPanel";

const SIDEBAR_WIDTH = 340;

export default function CanvasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [graph, setGraph] = useState<any>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [decisions, setDecisions] = useState<any>({});
  const [score, setScore] = useState<any>(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [constraintError, setConstraintError] = useState<{
    message: string;
    affectedNodeType?: string;
    fixes?: any[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/student-mode/materialize?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        if (!data?.nodes) return;
        setGraph(projectToCanvas(data));
      });
  }, [projectId]);

  useEffect(() => {
    fetch(`/api/student-mode/decisions?projectId=${projectId}`)
      .then(res => res.json())
      .then(setDecisions);
  }, [projectId]);

  useEffect(() => {
    fetch(`/api/student-mode/score?projectId=${projectId}`)
      .then(res => res.json())
      .then(setScore)
      .catch(() => setScore(null));
  }, [projectId, decisions]);

  useEffect(() => {
    fetch(`/api/student-mode/suggestions?projectId=${projectId}`)
      .then(res => res.json())
      .then(setSuggestions)
      .catch(() => setSuggestions([]));
  }, [projectId, decisions, score]);

  if (!graph) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading canvas…
      </div>
    );
  }

  const activeNode = graph.nodes.find((n: any) => n.id === activeNodeId);
  const nodeExplanation = activeNode ? explainNode(activeNode) : null;
  const edgeExplanation = selectedEdge ? explainEdge(selectedEdge) : null;

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* CANVAS */}
      <div
        className="relative overflow-hidden h-screen"
        style={{ width: `calc(100vw - ${SIDEBAR_WIDTH}px)` }}
        onClick={() => {
          setActiveNodeId(null);
          setSelectedEdge(null);
          setConstraintError(null);
        }}
      >
        {/* Score Badge */}
        {score && (
          <div className="absolute top-4 left-4 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowScoreBreakdown(!showScoreBreakdown);
              }}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2 hover:border-zinc-500 transition"
            >
              <div className="text-xs text-zinc-400 uppercase font-semibold">Architecture Score</div>
              <div className="text-2xl font-bold text-indigo-400">
                {score.total} <span className="text-sm text-zinc-500">/ {score.maxTotal}</span>
              </div>
            </button>

            {/* Score Breakdown Modal */}
            {showScoreBreakdown && (
              <div className="absolute top-full left-0 mt-2 bg-zinc-900 border border-zinc-700 rounded-lg p-4 w-80">
                <div className="space-y-3">
                  {Object.entries(score.breakdown).map(([key, data]: [string, any]) => {
                    const percentage = (data.score / data.max) * 100;
                    const status = percentage >= 80 ? "✔" : percentage >= 50 ? "⚠" : "✖";
                    const color = percentage >= 80 ? "text-green-400" : percentage >= 50 ? "text-yellow-400" : "text-red-400";

                    return (
                      <div key={key} className="border-b border-zinc-800 pb-3 last:border-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className={color}>{status}</span>
                            <span className="font-semibold capitalize">{key}</span>
                          </div>
                          <span className="text-sm text-zinc-400">
                            {data.score} / {data.max}
                          </span>
                        </div>
                        <div className="text-xs text-zinc-500">{data.reason}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SVG Edge Layer */}
        <svg
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height="100%"
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
            </marker>
          </defs>

          {graph.edges.map((edge: any, i: number) => {
            const from = graph.nodes.find((n: any) => n.id === edge.from);
            const to = graph.nodes.find((n: any) => n.id === edge.to);

            if (!from || !to) return null;

            const x1 = from.x + 224; // node width
            const y1 = from.y + 40;
            const x2 = to.x;
            const y2 = to.y + 40;

            return (
              <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#6366f1"
                strokeWidth="2"
                strokeOpacity="0.7"
                markerEnd="url(#arrow)"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEdge(edge);
                  setActiveNodeId(null);
                  setConstraintError(null);
                }}
                className="cursor-pointer hover:stroke-indigo-400"
                style={{ pointerEvents: 'stroke' }}
              />
            );
          })}
        </svg>

        {/* Nodes */}
        {graph.nodes.map((node: any) => {
          const isActive = node.id === activeNodeId;
          const isViolated = constraintError?.affectedNodeType === node.type;

          return (
            <div
              key={node.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveNodeId(node.id);
                setSelectedEdge(null);
                setConstraintError(null);
              }}
              style={{ left: node.x, top: node.y }}
              className={`
                absolute z-10 w-56 p-4 rounded cursor-pointer transition
                ${isViolated
                  ? "bg-red-900/30 border-2 border-red-500"
                  : isActive 
                    ? "bg-zinc-800 border border-indigo-500"
                    : "bg-zinc-900 border border-zinc-700 hover:border-zinc-500"}
              `}
            >
              <div className="text-xs text-zinc-400 uppercase">{node.type}</div>
              <div className="font-semibold">{node.label}</div>
              {isViolated && (
                <div className="text-xs text-red-400 mt-2 flex items-center gap-1">
                  <span>⚠</span>
                  <span>Constraint violated</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SIDEBAR */}
      <div
        className="border-l border-zinc-800 bg-zinc-950 p-4"
        style={{ width: SIDEBAR_WIDTH }}
      >
        {constraintError ? (
          <div className="bg-red-900/20 border border-red-500 rounded p-4">
            <div className="flex items-center gap-2 text-red-400 font-semibold mb-2">
              <span>⚠</span>
              <span>Constraint Violation</span>
            </div>
            <p className="text-sm text-red-300 mb-4">{constraintError.message}</p>
            
            {constraintError.fixes && constraintError.fixes.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-zinc-400 font-semibold uppercase">Suggested Fixes:</p>
                {constraintError.fixes.map((fix: any) => (
                  <button
                    key={fix.id}
                    onClick={async () => {
                      if (fix.action.type === 'UPDATE_DECISION') {
                        const res = await fetch('/api/student-mode/decisions', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            projectId,
                            key: fix.action.payload.key,
                            value: fix.action.payload.value,
                          }),
                        });

                        if (res.ok) {
                          const data = await res.json();
                          setDecisions(data);
                          setConstraintError(null);
                        }
                      }
                    }}
                    className="w-full p-3 rounded border border-indigo-500 bg-indigo-950 hover:bg-indigo-900 transition text-left"
                  >
                    <div className="font-medium text-indigo-300">{fix.label}</div>
                    <div className="text-xs text-indigo-400 mt-1">{fix.description}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : activeNode?.type === "backend" ? (
          <BackendDecision
            projectId={projectId}
            value={decisions.backendType}
            onSelect={(val) => {
              setDecisions((prev: any) => ({
                ...prev,
                backendType: val
              }));
            }}
            onConstraintError={setConstraintError}
          />
        ) : !nodeExplanation && !edgeExplanation ? (
          <div className="space-y-6">
            <div className="text-zinc-500 text-sm">
              Select a component or connection to understand why it exists.
            </div>

            {/* Decision Panel */}
            <DecisionPanel
              projectId={projectId}
              onUpdate={(data: any) => {
                if (data.architecture) {
                  setGraph(projectToCanvas(data.architecture));
                }
              }}
            />

            {/* Version Panel */}
            <VersionPanel
              projectId={projectId}
              onLoad={(data: any) => {
                if (data.architecture) {
                  setGraph(projectToCanvas(data.architecture));
                }
              }}
            />

            {/* Suggestions Section */}
            {suggestions.length > 0 && (
              <div className="pt-4 border-t border-zinc-800">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">
                  Suggested Improvements
                </h3>
                <div className="space-y-3">
                  {suggestions.map((suggestion: any) => (
                    <div
                      key={suggestion.id}
                      className="bg-zinc-900 border border-zinc-700 rounded p-3"
                    >
                      <div className="font-medium text-zinc-200 mb-1">
                        {suggestion.title}
                      </div>
                      <div className="text-xs text-zinc-400 mb-2">
                        {suggestion.reason}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {Object.entries(suggestion.impact).map(([key, value]: [string, any]) => {
                          const isPositive = value > 0;
                          return (
                            <span
                              key={key}
                              className={`px-2 py-1 rounded ${
                                isPositive
                                  ? "bg-green-900/30 text-green-400"
                                  : "bg-red-900/30 text-red-400"
                              }`}
                            >
                              {isPositive ? "+" : ""}{value} {key}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : nodeExplanation ? (
          <NodeExplain
            title={nodeExplanation.title}
            explanation={nodeExplanation.explanation}
          />
        ) : edgeExplanation ? (
          <NodeExplain
            title={edgeExplanation.title}
            explanation={edgeExplanation.explanation}
          />
        ) : null}
      </div>
    </div>
  );
}
