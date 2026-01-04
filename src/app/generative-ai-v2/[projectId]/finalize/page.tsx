"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayoutWrapper from "@/components/DashboardLayoutWrapper";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Info,
  Rocket,
  RotateCcw,
  FileJson,
  DollarSign,
  Activity
} from "lucide-react";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  MarkerType
} from "reactflow";
import "reactflow/dist/style.css";

interface ModuleNode {
  id: string;
  type: string;
  label: string;
  meta?: Record<string, unknown>;
}

interface ModuleEdge {
  from: string;
  to: string;
  label?: string;
}

interface Check {
  id: string;
  severity: "info" | "warning" | "critical";
  category: string;
  message: string;
  resolution: string;
  code?: string;
}

interface ReadinessReport {
  overallScore: number;
  checks: Check[];
  timestamp: string;
}

interface CostBreakdown {
  appServers: number;
  database: number;
  cache: number;
  storage: number;
  cdn: number;
  monitoring: number;
  thirdParty: number;
}

interface CostScenario {
  monthly: number;
  breakdown: CostBreakdown;
}

interface CostEstimate {
  low: CostScenario;
  typical: CostScenario;
  peak: CostScenario;
  confidence: "low" | "medium" | "high";
  assumptions: string[];
}

export default function FinalizePage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<{ version: number; nodes: ModuleNode[]; edges: ModuleEdge[]; modules: string[]; createdAt: string } | null>(null);
  const [readiness, setReadiness] = useState<ReadinessReport | null>(null);
  const [costs, setCosts] = useState<CostEstimate | null>(null);
  const [modules, setModules] = useState<{ total: number; approved: number; proposed: number } | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<"low" | "typical" | "peak">("typical");

  useEffect(() => {
    fetchFinalizeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const fetchFinalizeData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/finalize`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.ok) {
        setSnapshot(data.snapshot);
        setReadiness(data.readinessReport);
        setCosts(data.costEstimate);
        setModules(data.modules);
      } else {
        alert(data.error || "Failed to load finalize data");
      }
    } catch (err) {
      console.error("Finalize fetch error:", err);
      alert("Failed to load finalize data");
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = () => {
    if (!snapshot) return;
    const json = JSON.stringify(snapshot, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `architecture-v${snapshot.version}.json`;
    a.click();
  };

  const handlePublish = async () => {
    if (!snapshot) return;
    if (!confirm("Publish this architecture? This will mark it as production-ready.")) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/publish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ snapshotVersion: snapshot.version, target: "staging" })
      });

      const data = await res.json();
      if (data.ok) {
        alert(`Published successfully! Snapshot v${snapshot.version}`);
      } else {
        alert(data.error || "Publish failed");
      }
    } catch (err) {
      console.error("Publish error:", err);
      alert("Publish failed");
    }
  };

  const handleRollback = async () => {
    const version = prompt("Enter snapshot version to rollback to:");
    if (!version) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/generative/projects/${projectId}/snapshots/rollback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ version: parseInt(version) })
      });

      const data = await res.json();
      if (data.ok) {
        alert(`Rolled back to v${version}`);
        fetchFinalizeData();
      } else {
        alert(data.error || "Rollback failed");
      }
    } catch (err) {
      console.error("Rollback error:", err);
      alert("Rollback failed");
    }
  };

  // Convert to React Flow format
  const { nodes, edges } = React.useMemo(() => {
    if (!snapshot) return { nodes: [], edges: [] };

    const flowNodes: Node[] = snapshot.nodes.map((node: ModuleNode, index: number) => ({
      id: node.id,
      type: "default",
      position: {
        x: 150 + (index % 4) * 250,
        y: 100 + Math.floor(index / 4) * 150
      },
      data: { label: node.label }
    }));

    const flowEdges: Edge[] = snapshot.edges
      .filter((edge: ModuleEdge) => edge.from && edge.to)
      .map((edge: ModuleEdge, index: number) => ({
        id: `e${index}`,
        source: edge.from,
        target: edge.to,
        sourceHandle: null,
        targetHandle: null,
        label: edge.label,
        animated: true,
        type: "smoothstep",
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 20,
          height: 20,
          color: "#6366f1"
        }
      }));

    return { nodes: flowNodes, edges: flowEdges };
  }, [snapshot]);

  if (loading) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Final Review">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            <p className="mt-4 text-zinc-400">Loading final review...</p>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  if (!snapshot) {
    return (
      <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Final Review">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-zinc-400">No snapshot found. Approve some modules first.</p>
            <Button onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        </div>
      </DashboardLayoutWrapper>
    );
  }

  const currentCost = costs?.[selectedScenario];
  const severityConfig = {
    critical: { icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/30" },
    warning: { icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
    info: { icon: Info, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" }
  };

  return (
    <DashboardLayoutWrapper activeNav="recent" breadcrumb="AI Architecture Builder > Final Review">
      <div className="space-y-4">
        {/* Header */}
        <div className="panel-elev px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="text-zinc-400 hover:text-white cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-zinc-700" />
              <h1 className="text-xl font-bold text-white">Final Architecture Review</h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-green-600/20 border border-green-500/30 text-xs text-green-300">
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Ready for Review
              </div>
              <div className="px-3 py-1 rounded-full bg-zinc-800/50 text-xs text-zinc-300">
                v{snapshot.version}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-4">
            <Button
              onClick={handleExportJSON}
              variant="outline"
              size="sm"
              className="cursor-pointer text-zinc-700 hover:text-zinc-950 border-zinc-700 hover:border-zinc-600"
            >
              <FileJson className="w-4 h-4 mr-2" />
              Export JSON
            </Button>
            <Button
              onClick={handlePublish}
              className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
              size="sm"
            >
              <Rocket className="w-4 h-4 mr-2" />
              Publish
            </Button>
            <Button
              onClick={handleRollback}
              variant="outline"
              size="sm"
              className="cursor-pointer text-zinc-700 hover:text-zinc-900 border-zinc-700 hover:border-zinc-600"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Rollback
            </Button>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Left: Summary Cards */}
          <div className="col-span-3 space-y-4">
            {/* Modules Summary */}
            <div className="panel-soft p-4">
              <div className="text-xs text-zinc-400 mb-2">Modules</div>
              <div className="text-2xl font-bold text-white">{modules?.approved}/{modules?.total}</div>
              <div className="text-xs text-zinc-500">Approved</div>
            </div>

            {/* Health Score */}
            <div className="panel-soft p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-zinc-400">Health Score</div>
                <Activity className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">{readiness?.overallScore || 0}/100</div>
              <div className={`text-xs ${
                (readiness?.overallScore || 0) >= 80 ? 'text-green-400' :
                (readiness?.overallScore || 0) >= 60 ? 'text-yellow-400' : 'text-red-400'
              }`}>
                {(readiness?.overallScore || 0) >= 80 ? 'Excellent' :
                 (readiness?.overallScore || 0) >= 60 ? 'Good' : 'Needs Work'}
              </div>
            </div>

            {/* Cost Estimate */}
            <div className="panel-soft p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-zinc-400">Est. Monthly Cost</div>
                <DollarSign className="w-4 h-4 text-green-400" />
              </div>
              <div className="text-2xl font-bold text-white">${currentCost?.monthly || 0}</div>
              <div className="flex gap-1 mt-2">
                <button
                  onClick={() => setSelectedScenario("low")}
                  className={`px-2 py-1 text-xs rounded cursor-pointer ${
                    selectedScenario === "low" ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  Low
                </button>
                <button
                  onClick={() => setSelectedScenario("typical")}
                  className={`px-2 py-1 text-xs rounded cursor-pointer ${
                    selectedScenario === "typical" ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  Typical
                </button>
                <button
                  onClick={() => setSelectedScenario("peak")}
                  className={`px-2 py-1 text-xs rounded cursor-pointer ${
                    selectedScenario === "peak" ? 'bg-indigo-600 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  Peak
                </button>
              </div>
            </div>

            {/* Nodes & Edges */}
            <div className="panel-soft p-4">
              <div className="text-xs text-zinc-400 mb-2">Architecture</div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300">Nodes</span>
                  <span className="text-white font-medium">{snapshot.nodes.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-300">Edges</span>
                  <span className="text-white font-medium">{snapshot.edges.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Merged Diagram */}
          <div className="col-span-6">
            <div className="panel-elev rounded-xl h-[600px]">
              <div className="px-4 py-3 border-b border-zinc-800/30">
                <h3 className="text-sm font-semibold text-white">Full Architecture</h3>
              </div>
              <div className="h-[calc(100%-3rem)]">
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  fitView
                  fitViewOptions={{ padding: 0.3 }}
                  minZoom={0.3}
                  maxZoom={1.5}
                  defaultEdgeOptions={{
                    animated: true,
                    type: "smoothstep"
                  }}
                >
                  <Background color="rgba(255,255,255,0.015)" gap={24} />
                  <Controls className="bg-zinc-900/80 border-zinc-800" />
                  <MiniMap className="bg-zinc-900/80 border border-zinc-800" nodeColor="#6366f1" />
                </ReactFlow>
              </div>
            </div>
          </div>

          {/* Right: Readiness & Costs */}
          <div className="col-span-3 space-y-4">
            {/* Readiness Report */}
            <div className="panel-soft p-4 max-h-[400px] overflow-y-auto">
              <h3 className="text-sm font-semibold text-white mb-3">Readiness Checks</h3>
              <div className="space-y-2">
                {readiness?.checks.length === 0 ? (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                    <p className="text-sm text-green-300">All checks passed!</p>
                  </div>
                ) : (
                  readiness?.checks.map((check) => {
                    const config = severityConfig[check.severity];
                    const Icon = config.icon;
                    return (
                      <div
                        key={check.id}
                        className={`p-3 rounded-lg border ${config.bg} ${config.border}`}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className={`w-4 h-4 ${config.color} mt-0.5`} />
                          <div className="flex-1">
                            <div className="text-xs font-medium text-white mb-1">
                              {check.message}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {check.resolution}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cost Breakdown */}
            {currentCost && (
              <div className="panel-soft p-4">
                <h3 className="text-sm font-semibold text-white mb-3">Cost Breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(currentCost.breakdown).map(([key, value]) => (
                    value > 0 && (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-zinc-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="text-white font-medium">${value.toFixed(2)}</span>
                      </div>
                    )
                  ))}
                  <div className="pt-2 mt-2 border-t border-zinc-800 flex justify-between">
                    <span className="text-sm font-medium text-white">Total</span>
                    <span className="text-sm font-bold text-white">${currentCost.monthly.toFixed(2)}/mo</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayoutWrapper>
  );
}
