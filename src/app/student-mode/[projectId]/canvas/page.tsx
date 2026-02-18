"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectToCanvas } from "@/lib/student-mode/canvas-layout";
import { explainNode } from "@/lib/student-mode/explain";
import { explainEdge } from "@/lib/student-mode/explain-edge";
import { estimateCost } from "@/lib/student-mode/cost-estimator";
import NodeExplain from "@/components/student-mode/NodeExplain";
import BackendDecision from "@/components/student-mode/BackendDecision";
import DecisionPanel from "@/components/student-mode/DecisionPanel";
import VersionPanel from "@/components/student-mode/VersionPanel";
import CostPanel from "@/components/student-mode/CostPanel";
import StepFooter from "@/components/student-mode/StepFooter";

const SIDEBAR_WIDTH = 340;

export default function CanvasPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const [graph, setGraph] = useState<{
    nodes: Array<{ id: string; label: string; type: string }>;
    edges: Array<{ source: string; target: string }>;
  } | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ source: string; target: string } | null>(null);
  const [decisions, setDecisions] = useState<Record<string, unknown>>({});
  const [score, setScore] = useState<Record<string, unknown> | null>(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<Record<string, unknown>>>([]);
  const [constraintError, setConstraintError] = useState<{
    message: string;
    affectedNodeType?: string;
    fixes?: any[];
  } | null>(null);

  useEffect(() => {
    fetch(`/api/student-mode/materialize?projectId=${projectId}`)
      .then(res => res.json())
      .then(response => {
        // Extract architecture from full contract
        const data = response.architecture || response;
        if (!data?.nodes) return;
        setGraph(projectToCanvas(data));
        // Reasoning available at: response.reasoning (for future use)
      })
      .catch(err => {
        console.error("Failed to load architecture:", err);
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
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/10 to-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="text-lg text-zinc-400">Materializing architecture...</div>
        </div>
      </div>
    );
  }

  const activeNode = graph.nodes.find((n: any) => n.id === activeNodeId);
  const nodeExplanation = activeNode ? explainNode(activeNode) : null;
  const edgeExplanation = selectedEdge ? explainEdge(selectedEdge) : null;

  const teamSize = 3; // TODO: replace with real team state later
  const constraintsEnabled = !!constraintError; // Constraints active if error present
  const costEstimate = estimateCost(graph, teamSize, constraintsEnabled);

  return (
    <div className="min-h-screen bg-black text-white flex">

      {/* CANVAS */}
      <div
        className="relative overflow-hidden h-screen bg-gradient-to-br from-black via-zinc-950 to-black"
        style={{ width: `calc(100vw - ${SIDEBAR_WIDTH}px)` }}
        onClick={() => {
          setActiveNodeId(null);
          setSelectedEdge(null);
          setConstraintError(null);
        }}
      >
        {/* Grid Pattern Background */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        {/* Score Badge */}
        {score && (
          <div className="absolute top-6 left-6 z-20">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowScoreBreakdown(!showScoreBreakdown);
              }}
              className="group relative backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border border-zinc-700/50 rounded-2xl px-6 py-4 hover:border-purple-500/50 transition-all duration-300 shadow-2xl hover:shadow-purple-500/25 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative">
                <div className="text-xs text-zinc-400 uppercase font-semibold tracking-wider mb-1">Architecture Quality</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                    {score.total}
                  </span>
                  <span className="text-sm text-zinc-500">/ {score.maxTotal}</span>
                </div>
              </div>
            </button>

            {/* Score Breakdown Modal */}
            {showScoreBreakdown && score?.breakdown && (
              <div className="absolute top-full left-0 mt-3 backdrop-blur-xl bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 border border-zinc-700/50 rounded-2xl p-6 w-96 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-4">
                  {Object.entries(score.breakdown).map(([key, data]: [string, any]) => {
                    const percentage = (data.score / data.max) * 100;
                    const status = percentage >= 80 ? "✔" : percentage >= 50 ? "⚠" : "✖";
                    const color = percentage >= 80 ? "text-green-400" : percentage >= 50 ? "text-yellow-400" : "text-red-400";
                    const bgColor = percentage >= 80 ? "from-green-500/20 to-green-600/20" : percentage >= 50 ? "from-yellow-500/20 to-yellow-600/20" : "from-red-500/20 to-red-600/20";
                    const barColor = percentage >= 80 ? "from-green-500 to-green-600" : percentage >= 50 ? "from-yellow-500 to-yellow-600" : "from-red-500 to-red-600";

                    return (
                      <div key={key} className={`bg-gradient-to-br ${bgColor} border border-zinc-700/30 rounded-xl p-4`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`${color} text-lg`}>{status}</span>
                            <span className="font-semibold capitalize text-white">{key}</span>
                          </div>
                          <span className="text-sm text-zinc-400 font-mono">
                            {data.score} / {data.max}
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800/50 rounded-full overflow-hidden mb-2">
                          <div 
                            className={`h-full bg-gradient-to-r ${barColor} transition-all duration-500`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-zinc-400">{data.reason}</div>
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
          
          // Node type color mapping
          const nodeColors = {
            frontend: { border: "border-blue-500/50", bg: "from-blue-500/10 to-blue-600/5", glow: "shadow-blue-500/25" },
            backend: { border: "border-purple-500/50", bg: "from-purple-500/10 to-purple-600/5", glow: "shadow-purple-500/25" },
            database: { border: "border-green-500/50", bg: "from-green-500/10 to-green-600/5", glow: "shadow-green-500/25" },
            cache: { border: "border-orange-500/50", bg: "from-orange-500/10 to-orange-600/5", glow: "shadow-orange-500/25" },
            queue: { border: "border-yellow-500/50", bg: "from-yellow-500/10 to-yellow-600/5", glow: "shadow-yellow-500/25" },
          };
          
          const colors = nodeColors[node.type as keyof typeof nodeColors] || nodeColors.backend;

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
                group absolute z-10 w-64 backdrop-blur-xl rounded-2xl cursor-pointer transition-all duration-300
                ${isViolated
                  ? "bg-gradient-to-br from-red-900/40 to-red-800/40 border-2 border-red-500 shadow-lg shadow-red-500/50"
                  : isActive 
                    ? `bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-xl ${colors.glow} scale-105`
                    : `bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border border-zinc-700/50 hover:${colors.border} hover:shadow-lg hover:${colors.glow} hover:scale-105`}
              `}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider backdrop-blur-sm ${
                    isActive ? `bg-gradient-to-r ${colors.bg} ${colors.border} border` : "bg-zinc-800/50 text-zinc-400"
                  }`}>
                    {node.type}
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                <div className="font-semibold text-lg text-white mb-1">{node.label}</div>
                {isViolated && (
                  <div className="flex items-center gap-2 text-red-400 text-sm mt-3 p-2 bg-red-500/10 rounded-lg border border-red-500/30">
                    <span className="text-lg">⚠</span>
                    <span>Constraint violated</span>
                  </div>
                )}
              </div>
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl -z-10"></div>
              )}
            </div>
          );
        })}
      </div>

      {/* SIDEBAR */}
      <div
        className="border-l border-zinc-800/50 bg-gradient-to-b from-zinc-950/95 to-black/95 backdrop-blur-xl p-6 overflow-y-auto"
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

            {/* Cost Estimation */}
            <div className="pt-4 border-t border-zinc-800">
              <CostPanel estimate={costEstimate} />
            </div>
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

      <StepFooter projectId={projectId} currentStep="canvas" canContinue={true} />
    </div>
  );
}
