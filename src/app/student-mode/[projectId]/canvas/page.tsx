"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectToCanvas } from "@/lib/student-mode/canvas-layout";
import { explainNode } from "@/lib/student-mode/explain";
import { explainEdge } from "@/lib/student-mode/explain-edge";
import { loadBuild } from "@/lib/student-mode/build-store";
import { architectureStore } from "@/lib/student-mode/store";
import { COMPONENTS, ComponentId } from "@/lib/student-mode/component-catalog";
import NodeExplain from "@/components/student-mode/NodeExplain";
import BackendDecision from "@/components/student-mode/BackendDecision";
import DecisionPanel from "@/components/student-mode/DecisionPanel";
import VersionPanel from "@/components/student-mode/VersionPanel";
import CostPanel from "@/components/student-mode/CostPanel";
import StepFooter from "@/components/student-mode/StepFooter";
import AIStatusBadge from "@/components/student-mode/AIStatusBadge";

// ── Auto-generate logical edges based on which components are selected ──────
function buildEdgesFromSelection(selectedIds: ComponentId[]) {
  const has = (id: ComponentId) => selectedIds.includes(id);
  const edges: { from: string; to: string; label?: string }[] = [];

  // Frontend → load balancer or api-server
  if (has("web-frontend")) {
    if (has("load-balancer")) edges.push({ from: "web-frontend", to: "load-balancer", label: "HTTPS" });
    else if (has("api-gateway")) edges.push({ from: "web-frontend", to: "api-gateway", label: "HTTPS" });
    else if (has("api-server")) edges.push({ from: "web-frontend", to: "api-server", label: "REST" });
  }
  if (has("mobile-app")) {
    if (has("api-gateway")) edges.push({ from: "mobile-app", to: "api-gateway", label: "HTTPS" });
    else if (has("api-server")) edges.push({ from: "mobile-app", to: "api-server", label: "REST" });
  }

  // Load balancer / gateway → api-server
  if (has("load-balancer") && has("api-server"))
    edges.push({ from: "load-balancer", to: "api-server", label: "routes" });
  if (has("api-gateway") && has("api-server"))
    edges.push({ from: "api-gateway", to: "api-server", label: "routes" });

  // API server → databases
  if (has("api-server") && has("auth-service"))
    edges.push({ from: "api-server", to: "auth-service", label: "verify" });
  if (has("api-server") && has("primary-db"))
    edges.push({ from: "api-server", to: "primary-db", label: "read/write" });
  if (has("api-server") && has("cache"))
    edges.push({ from: "api-server", to: "cache", label: "cache" });
  if (has("api-server") && has("message-queue"))
    edges.push({ from: "api-server", to: "message-queue", label: "publish" });
  if (has("api-server") && has("object-storage"))
    edges.push({ from: "api-server", to: "object-storage", label: "upload" });

  // DB replicas
  if (has("primary-db") && has("read-replica"))
    edges.push({ from: "primary-db", to: "read-replica", label: "replicate" });

  // Queue → worker
  if (has("message-queue") && has("backend-worker"))
    edges.push({ from: "message-queue", to: "backend-worker", label: "consume" });
  if (has("backend-worker") && has("primary-db"))
    edges.push({ from: "backend-worker", to: "primary-db", label: "write" });

  // Monitoring
  if (has("monitoring") && has("api-server"))
    edges.push({ from: "api-server", to: "monitoring", label: "metrics" });

  // CDN
  if (has("cdn") && (has("web-frontend") || has("object-storage")))
    edges.push({ from: "cdn", to: has("object-storage") ? "object-storage" : "web-frontend", label: "serve" });

  return edges;
}

/* Map catalog component IDs to canvas node types */
const ID_TO_CANVAS_TYPE: Partial<Record<ComponentId, string>> = {
  "web-frontend": "frontend",
  "mobile-app": "frontend",
  "api-server": "backend",
  "backend-worker": "backend",
  "microservices": "backend",
  "primary-db": "database",
  "read-replica": "database",
  "cache": "cache",
  "load-balancer": "load_balancer",
  "api-gateway": "backend",
  "cdn": "frontend",
  "object-storage": "backend",
  "message-queue": "queue",
  "auth-service": "backend",
  "waf": "backend",
  "monitoring": "backend",
};


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
  const [score, setScore] = useState<any>(null);
  const [showScoreBreakdown, setShowScoreBreakdown] = useState(false);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [costEstimate, setCostEstimate] = useState<any>(null);
  const [constraintError, setConstraintError] = useState<{
    message: string;
    affectedNodeType?: string;
    fixes?: any[];
  } | null>(null);

  useEffect(() => {
    // ── Load student's OWN build first; fallback to AI architecture ──
    const buildData = loadBuild(projectId);
    console.log("[Canvas] loadBuild result:", buildData);
    
    if (buildData?.selectedIds?.length) {
      const selectedIds = buildData.selectedIds;
      const nodes = selectedIds.map((id) => {
        const comp = COMPONENTS.find((c) => c.id === id);
        return {
          id,
          label: comp?.name ?? id,
          type: ID_TO_CANVAS_TYPE[id] ?? "backend",
        };
      });
      const edges = buildEdgesFromSelection(selectedIds);
      console.log("[Canvas] Using student build:", { nodes, edges });
      const canvasGraph = projectToCanvas({ nodes, edges } as any);
      setGraph(canvasGraph);
      // Save to architectureStore so cost endpoint can access it
      architectureStore.set(projectId, { nodes, edges });
    } else {
      // Fallback: AI-generated architecture OR default
      console.log("[Canvas] No student build, trying AI architecture...");
      
      // ALWAYS show default immediately to prevent blank canvas
      const defaultArch = {
        nodes: [
          { id: "web-frontend", label: "Web Frontend", type: "frontend" },
          { id: "api-server", label: "API Server", type: "backend" },
          { id: "primary-db", label: "Database", type: "database" },
        ],
        edges: [
          { from: "web-frontend", to: "api-server", label: "HTTPS" },
          { from: "api-server", to: "primary-db", label: "read/write" },
        ],
      };
      const defaultCanvas = projectToCanvas(defaultArch);
      setGraph(defaultCanvas);
      // Save default to architectureStore
      architectureStore.set(projectId, defaultArch);
      
      // Then try to load AI arch in background
      fetch(`/api/student-mode/materialize?projectId=${projectId}`)
        .then(res => res.json())
        .then(response => {
          console.log("[Canvas] Materialize API response:", response);
          const data = response.architecture || response;
          if (data?.nodes && Array.isArray(data.nodes) && data.nodes.length > 0) {
            console.log("[Canvas] Replacing default with AI architecture");
            const aiCanvas = projectToCanvas(data);
            setGraph(aiCanvas);
            // Save AI arch to store
            architectureStore.set(projectId, data);
          } else {
            console.warn("[Canvas] AI returned invalid architecture, keeping default");
          }
        })
        .catch(err => {
          console.error("[Canvas] Failed to load AI architecture:", err);
          console.log("[Canvas] Keeping default architecture");
        });
    }
  }, [projectId]);


  useEffect(() => {
    fetch(`/api/student-mode/decisions?projectId=${projectId}`)
      .then(res => res.json())
      .then(setDecisions)
      .catch(err => console.error("[Canvas] Decisions error:", err));
  }, [projectId]);

  // Fetch AI insights ONCE on mount - lock the responses
  useEffect(() => {
    if (!projectId) return;
    
    console.log("[Canvas] Fetching AI insights (ONE TIME)...");
    
    // Score
    fetch(`/api/student-mode/score?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        console.log("[Canvas] Score response (LOCKED):", data);
        setScore(data);
      })
      .catch(err => {
        console.error("[Canvas] Score error:", err);
        setScore(null);
      });
    
    // Suggestions
    fetch(`/api/student-mode/suggestions?projectId=${projectId}`)
      .then(res => res.json())
      .then(data => {
        console.log("[Canvas] Suggestions response (LOCKED):", data);
        setSuggestions(data);
      })
      .catch(err => {
        console.error("[Canvas] Suggestions error:", err);
        setSuggestions(null);
      });
    
    // Cost - wait for graph to load first
    const attemptCost = () => {
      if (!graph) {
        setTimeout(attemptCost, 500);
        return;
      }
      fetch(`/api/student-mode/cost?projectId=${projectId}`)
        .then(res => res.json())
        .then(data => {
          console.log("[Canvas] Cost response (LOCKED):", data);
          if (!data.error) {
            setCostEstimate(data);
          } else {
            console.warn("[Canvas] Cost returned error:", data.error);
          }
        })
        .catch(err => {
          console.error("[Canvas] Cost error:", err);
        });
    };
    attemptCost();
  }, [projectId]);

  if (!graph) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-purple-950/10 to-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <div className="text-lg text-zinc-400">Rendering your architecture...</div>
        </div>
      </div>
    );
  }

  console.log("[Canvas] Rendering with graph:", graph);
  console.log("[Canvas] Nodes count:", graph.nodes?.length);
  console.log("[Canvas] Edges count:", graph.edges?.length);

  const activeNode = graph.nodes.find((n: any) => n.id === activeNodeId);
  const nodeExplanation = activeNode ? explainNode(activeNode) : null;
  const edgeExplanation = selectedEdge ? explainEdge(selectedEdge) : null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* TOP: Progress Header */}
      <div className="border-b border-zinc-800/50 bg-gradient-to-r from-zinc-950/95 via-purple-950/30 to-zinc-950/95 backdrop-blur-xl px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-400 uppercase tracking-wider font-semibold mb-1">Student Mode</div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Architecture Review & Optimization
            </h1>
          </div>
          <div className="flex items-center gap-4">
            {score && (
              <div className="text-right">
                <div className="text-xs text-zinc-400 mb-1">Quality Score</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {score.total}<span className="text-sm text-zinc-500">/{score.maxTotal}</span>
                </div>
              </div>
            )}
            <AIStatusBadge source={score?.source || suggestions?.source || costEstimate?.source} />
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* CANVAS */}
        <div
          className="relative overflow-hidden h-full bg-gradient-to-br from-black via-zinc-950 to-black flex-1"
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

          {/* Helper Text Overlay */}
          <div className="absolute top-6 left-6 z-20 backdrop-blur-xl bg-zinc-900/80 border border-zinc-700/50 rounded-xl px-4 py-3 max-w-md">
            <div className="text-xs text-zinc-400 flex items-center gap-2">
              <span className="text-purple-400">💡</span>
              <span>Click components to learn their purpose. Use the right panel to optimize your architecture.</span>
            </div>
          </div>

          {/* Debug: Show if no nodes */}
          {(!graph.nodes || graph.nodes.length === 0) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center space-y-4 backdrop-blur-xl bg-zinc-900/80 border border-red-500/50 rounded-2xl p-8 max-w-lg">
                <div className="text-6xl">⚠️</div>
                <div className="text-xl font-bold text-red-400">No Architecture Found</div>
                <div className="text-sm text-zinc-400">
                  Graph has {graph.nodes?.length || 0} nodes and {graph.edges?.length || 0} edges
                </div>
                <div className="text-xs text-zinc-500">Check console (F12) for debug logs</div>
              </div>
            </div>
          )}

          {/* Score Breakdown Button */}
          {score?.breakdown && (
            <div className="absolute top-20 left-6 z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowScoreBreakdown(!showScoreBreakdown);
                }}
                className="group relative backdrop-blur-xl bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border border-zinc-700/50 rounded-xl px-4 py-2 hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 text-sm"
              >
                <span className="text-zinc-300">{showScoreBreakdown ? "Hide" : "View"} Score Details</span>
              </button>

              {/* Score Breakdown Modal */}
              {showScoreBreakdown && (
                <div className="absolute top-full left-0 mt-3 backdrop-blur-xl bg-gradient-to-br from-zinc-900/95 to-zinc-800/95 border border-zinc-700/50 rounded-2xl p-6 w-96 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-zinc-200">Score Breakdown</h4>
                  <AIStatusBadge source={score.source} />
                </div>
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

          {graph.edges && Array.isArray(graph.edges) && graph.edges.map((edge: any, i: number) => {
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
        {graph.nodes && Array.isArray(graph.nodes) && graph.nodes.map((node: any) => {
          const isActive = node.id === activeNodeId;
          const isViolated = constraintError?.affectedNodeType === node.type;

          console.log(`[Canvas] Rendering node ${node.id} at x=${node.x} y=${node.y}`);

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
              style={{ left: `${node.x}px`, top: `${node.y}px`, position: 'absolute' }}
              className={`
                z-10 w-64 backdrop-blur-xl rounded-2xl cursor-pointer transition-all duration-300
                ${isViolated
                  ? "bg-gradient-to-br from-red-900/40 to-red-800/40 border-2 border-red-500 shadow-lg shadow-red-500/50"
                  : isActive
                    ? `bg-gradient-to-br ${colors.bg} border-2 ${colors.border} shadow-xl ${colors.glow} scale-105`
                    : `bg-gradient-to-br from-zinc-900/80 to-zinc-800/80 border border-zinc-700/50 hover:${colors.border} hover:shadow-lg hover:${colors.glow} hover:scale-105`}
              `}
            >
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wider backdrop-blur-sm ${isActive ? `bg-gradient-to-r ${colors.bg} ${colors.border} border` : "bg-zinc-800/50 text-zinc-400"
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

      {/* RIGHT SIDEBAR: Learning Flow */}
      <div className="w-[420px] border-l border-zinc-800/50 bg-gradient-to-b from-zinc-950/95 to-black/95 backdrop-blur-xl overflow-y-auto">
        {constraintError ? (
          <div className="p-6">
            <div className="bg-red-900/20 border border-red-500 rounded-xl p-4">
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
          </div>
        ) : activeNode?.type === "backend" ? (
          <div className="p-6">
            <div className="mb-4">
              <div className="text-xs text-purple-400 uppercase tracking-wider font-semibold mb-1">Component Details</div>
              <h3 className="text-lg font-bold text-white">{activeNode.label}</h3>
            </div>
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
          </div>
        ) : nodeExplanation ? (
          <div className="p-6">
            <div className="mb-4">
              <div className="text-xs text-purple-400 uppercase tracking-wider font-semibold mb-1">Component Details</div>
              <h3 className="text-lg font-bold text-white">{nodeExplanation.title}</h3>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <NodeExplain
                title=""
                explanation={nodeExplanation.explanation}
              />
            </div>
          </div>
        ) : edgeExplanation ? (
          <div className="p-6">
            <div className="mb-4">
              <div className="text-xs text-purple-400 uppercase tracking-wider font-semibold mb-1">Connection Details</div>
              <h3 className="text-lg font-bold text-white">{edgeExplanation.title}</h3>
            </div>
            <div className="prose prose-invert prose-sm max-w-none">
              <NodeExplain
                title=""
                explanation={edgeExplanation.explanation}
              />
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Step 1: Optimize Architecture */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">1</div>
                <h3 className="text-base font-semibold text-white">Architectural Decisions</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4">Toggle optimizations to improve your system's performance and scalability.</p>
              <DecisionPanel
                projectId={projectId}
                onUpdate={(data: any) => {
                  if (data.architecture) {
                    setGraph(projectToCanvas(data.architecture));
                  }
                }}
              />
            </div>

            {/* Step 2: AI Insights */}
            {suggestions?.suggestions?.length > 0 && (
              <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">2</div>
                  <h3 className="text-base font-semibold text-white">AI Recommendations</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-4">Smart suggestions to enhance your architecture based on best practices.</p>
                <div className="space-y-3">
                  {suggestions.suggestions.map((suggestion: any) => (
                    <div
                      key={suggestion.id}
                      className="bg-zinc-900/50 border border-zinc-700/50 rounded-lg p-3 hover:border-blue-500/50 transition-colors"
                    >
                      <div className="font-medium text-zinc-200 mb-1 text-sm">
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
                              className={`px-2 py-1 rounded ${isPositive
                                  ? "bg-green-900/30 text-green-400 border border-green-500/30"
                                  : "bg-red-900/30 text-red-400 border border-red-500/30"
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

            {/* Step 3: Cost Analysis */}
            {costEstimate && (
              <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">3</div>
                  <h3 className="text-base font-semibold text-white">Cost Estimation</h3>
                </div>
                <p className="text-xs text-zinc-400 mb-4">Understand the financial implications of your architectural choices.</p>
                <CostPanel estimate={costEstimate} source={costEstimate.source} />
              </div>
            )}

            {/* Step 4: Version Control */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/30 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-full bg-orange-500 text-white flex items-center justify-center text-sm font-bold">4</div>
                <h3 className="text-base font-semibold text-white">Save & Iterate</h3>
              </div>
              <p className="text-xs text-zinc-400 mb-4">Save your current architecture and explore different approaches.</p>
              <VersionPanel
                projectId={projectId}
                onLoad={(data: any) => {
                  if (data.architecture) {
                    setGraph(projectToCanvas(data.architecture));
                  }
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>

      <StepFooter projectId={projectId} currentStep="canvas" canContinue={true} />
    </div>
  );
}
