"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  OnNodesChange,
  OnEdgesChange,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";

/**
 * ModuleCanvas - MASTER'S STUDENT MODE V2.5
 * Props: module (Module), snapshot (Snapshot) - both shape-simple
 *
 * Lightweight behaviour:
 * - Renders nodes/edges from props
 * - Allows dragging, connecting, deleting
 * - Double-click a node to rename
 * - Right-click a node to swap type (simple demo)
 * - Save button calls provided save handler
 *
 * Notes: This is intentionally minimal, test-friendly, and ready to expand.
 */

interface ModuleProp {
  _id: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: Array<{ id: string; type: string; label?: string; meta?: Record<string, any> }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges: Array<{ from: string; to: string; meta?: Record<string, any> }>;
}

interface SnapshotProp {
  version?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  edges?: any[];
}

interface Props {
  projectId?: string; // Optional for future use
  module: ModuleProp | null;
  snapshot?: SnapshotProp | null;
  mock?: boolean; // if true, do not call API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSave?: (payload: { nodes: Node[]; edges: Edge[] }) => Promise<any>;
}

export default function ModuleCanvas({ module, snapshot = null, mock = false, onSave }: Props) {
  // convert incoming module nodes/edges to reactflow Node/Edge
  const initialNodes = useMemo<Node[]>(() => {
    // if nodes contain positions (from snapshot) use them, else layout them heuristically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const snapshotPositions = (snapshot?.nodes || []).reduce<Record<string, any>>((acc, n) => {
      if (n.id && n.meta?.pos) acc[n.id] = n.meta.pos;
      return acc;
    }, {});
    return (module?.nodes || []).map((n, i) => {
      const pos = snapshotPositions[n.id] || { x: 160 * i + 50, y: 80 + (i % 3) * 80 };
      return {
        id: n.id,
        data: { label: n.label || n.id, meta: n.meta || {} },
        position: pos,
        type: "default",
      } as Node;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?._id, module?.nodes]);

  const initialEdges = useMemo<Edge[]>(() => {
    return (module?.edges || []).map((e, i) => ({
      id: `e-${e.from}-${e.to}-${i}`,
      source: e.from,
      target: e.to,
      data: { meta: e.meta || {} },
      animated: false,
      label: e.meta?.label || "",
    })) as Edge[];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?._id, module?.edges]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [editingNode, setEditingNode] = useState<{ id: string; label: string } | null>(null);
  const nodeRenameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module?._id]); // refresh when module changes

  const onNodesChange: OnNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds));
  }, []);

  const onEdgesChange: OnEdgesChange = useCallback((changes: EdgeChange[]) => {
    setEdges(eds => applyEdgeChanges(changes, eds));
  }, []);

  const onConnect = useCallback((connection: Connection) => {
    if (isLocked) return;
    const edgeObj: Edge = {
      id: `e-${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source!,
      target: connection.target!,
      animated: false,
    };
    setEdges(e => addEdge(edgeObj, e));
  }, [isLocked]);

  // double click to rename
  const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
    setEditingNode({ id: node.id, label: String(node.data?.label || node.id) });
    // autofocus is handled by input ref
  }, []);

  // right click -> swap type simple menu (demo: swap to client/service/database)
  const onNodeContextMenu = useCallback((ev: React.MouseEvent, node: Node) => {
    ev.preventDefault();
    // basic swap menu prompt (replace with dropdown in production)
    const options = ["service", "gateway", "database", "client"];
    const choice = prompt(`Swap type for "${node.data?.label || node.id}". Choose: ${options.join(", ")}`, node.type || "service");
    if (!choice) return;
    setNodes(ns => ns.map(n => (n.id === node.id ? { ...n, type: choice } : n)));
  }, []);

  // apply rename
  const applyRename = useCallback(() => {
    if (!editingNode) return;
    const id = editingNode.id;
    const label = editingNode.label.trim() || id;
    setNodes(ns => ns.map(n => (n.id === id ? { ...n, data: { ...n.data, label } } : n)));
    setEditingNode(null);
  }, [editingNode]);

  // save handler
  const handleSave = useCallback(async () => {
    if (mock || !onSave) {
      console.log("[ModuleCanvas] mock save payload", { nodes, edges });
      alert("Saved (mock)");
      return;
    }
    try {
      await onSave({ nodes, edges });
      alert("Saved");
    } catch (err) {
      console.error("Save failed", err);
      alert("Save failed");
    }
  }, [nodes, edges, mock, onSave]);

  // Fit view
  const fitView = useCallback(() => rfInstance?.fitView?.(), [rfInstance]);

  // zoom controls
  const zoomIn = useCallback(() => rfInstance?.zoomIn?.(), [rfInstance]);
  const zoomOut = useCallback(() => rfInstance?.zoomOut?.(), [rfInstance]);

  // basic add node helper
  const addNode = useCallback(() => {
    if (isLocked) return;
    const id = `node-${Date.now()}`;
    const newNode: Node = {
      id,
      data: { label: `New ${id}`, meta: {} },
      position: { x: 200 + Math.random() * 200, y: 120 + Math.random() * 160 },
      type: "default",
    };
    setNodes(n => n.concat(newNode));
  }, [isLocked]);

  // small helper to export json
  const exportJson = useCallback(() => {
    const snapshotData = {
      metadata: { moduleId: module?._id, name: module?.name },
      nodes: nodes.map(n => ({ id: n.id, label: n.data?.label, type: n.type, position: n.position, meta: n.data?.meta })),
      edges: edges.map(e => ({ id: e.id, from: e.source, to: e.target, label: e.label || "", meta: e.data?.meta })),
    };
    const str = JSON.stringify(snapshotData, null, 2);
    const blob = new Blob([str], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${module?.name || "module"}-snapshot.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [nodes, edges, module?.name, module?._id]);

  // keyboard: Enter to apply rename when editing
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editingNode && e.key === "Enter") applyRename();
      if (editingNode && e.key === "Escape") setEditingNode(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingNode, applyRename]);

  return (
    <div className="h-full flex flex-col bg-[radial-gradient(circle_at_top_left,#0b1020,#06060a)]">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900">
        <div className="flex items-center gap-3">
          <button title="Add node" onClick={addNode} className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm">+ Node</button>
          <button onClick={fitView} title="Fit" className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm">Fit</button>
          <button onClick={zoomIn} title="Zoom in" className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm">+</button>
          <button onClick={zoomOut} title="Zoom out" className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm">−</button>
          <button onClick={() => setIsLocked(v => !v)} title="Lock/Unlock" className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm">{isLocked ? "Unlock" : "Lock"}</button>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={exportJson} className="px-3 py-2 rounded bg-zinc-800 hover:bg-zinc-700 text-sm">Export</button>
          <button onClick={handleSave} className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 text-white text-sm">Save</button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={(rfi) => setRfInstance(rfi)}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeContextMenu={onNodeContextMenu}
          fitView
          nodesDraggable={!isLocked}
          nodesConnectable={!isLocked}
          className="bg-zinc-950"
        >
          <Background gap={24} size={1} color="#111827" />
          <Controls showInteractive={false} />
          <MiniMap nodeColor={() => "#0ea5a9"} />
        </ReactFlow>

        {/* Node rename modal */}
        {editingNode && (
          <div className="absolute z-50 left-1/2 top-1/4 -translate-x-1/2 w-[420px] bg-zinc-900 border border-zinc-800 rounded shadow-lg p-4">
            <h4 className="text-sm text-zinc-200 mb-2">Rename node</h4>
            <input
              ref={(el) => { nodeRenameRef.current = el; if (el) el.focus(); }}
              value={editingNode.label}
              onChange={(e) => setEditingNode({ ...editingNode, label: e.target.value })}
              className="w-full px-3 py-2 rounded bg-zinc-800 border border-zinc-700 text-white"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setEditingNode(null)} className="px-3 py-1.5 rounded bg-zinc-700 text-sm">Cancel</button>
              <button onClick={applyRename} className="px-3 py-1.5 rounded bg-indigo-600 text-white text-sm">Save</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
