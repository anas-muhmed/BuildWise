"use client";

import React from "react";
import { useDroppable } from "@dnd-kit/core";
import DroppedBlock from "./DroppedBlock";

interface DroppedComponent {
  id: string;
  type: string;
  x: number;
  y: number;
}

type Edge = { id: string; fromId: string; toId: string };

interface CanvasAreaProps {
  droppedComponents: DroppedComponent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  edges: Edge[];
  connectFrom: string | null;
  isConnecting: boolean;
  preview: { x: number; y: number };
  onBeginConnect: (id: string) => void;
  onFinishConnect: (id: string) => void;
  onCancelConnect: () => void;
  dragPointer?: { x: number; y: number };
  canvasRef: React.RefObject<HTMLDivElement | null>; // Allow null
}

const CanvasArea = ({
  droppedComponents,
  selectedId,
  onSelect,
  edges,
  connectFrom,
  isConnecting,
  preview,
  onBeginConnect,
  onFinishConnect,
  onCancelConnect,
  dragPointer,
  canvasRef,
}: CanvasAreaProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: "canvas-dropzone" });

  // Use ref for all DOM queries
  const getCanvasRect = () => canvasRef.current?.getBoundingClientRect();

  const portCenter = (id: string) => {
    if (!canvasRef.current) return { x: 0, y: 0 }; // Guard for undefined canvasRef.current
    const port = canvasRef.current.querySelector(`[data-port-id="${id}"]`) as HTMLElement | null;
    const cr = getCanvasRect();
    if (!port || !cr) return { x: 0, y: 0 };
    const pr = port.getBoundingClientRect();
    return { x: pr.left - cr.left + pr.width / 2, y: pr.top - cr.top + pr.height / 2 };
  };

  // preview is already in canvas coords
  const previewPoint = () => ({ x: preview.x, y: preview.y });

  return (
    <div
      id="canvas-dropzone"
      ref={node => {
        setNodeRef(node);
        if (canvasRef) {
          canvasRef.current = node || null; // Explicitly handle null
        }
      }}
      data-canvas="true"
      className={`relative flex-1 h-[calc(100vh-180px)] bg-white rounded-xl border-2 shadow-md transition-colors ${
        isOver ? "border-blue-400 bg-blue-50" : "border-dashed border-gray-400"
      }`}
      style={{
        backgroundImage: isOver
          ? "none"
          : "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)",
        backgroundSize: "20px 20px",
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          if (isConnecting) {
            onCancelConnect();
          } else {
            onSelect(null);
          }
        }
      }}
    >
      {/* Blocks layer (z-10) */}
      <div className="absolute inset-0 z-10">
        {droppedComponents.map((c) => {
          const connected = edges.some(e => e.fromId === c.id || e.toId === c.id);
          return (
            <DroppedBlock
              key={c.id}
              id={c.id}
              type={c.type}
              x={c.x}
              y={c.y}
              selected={selectedId === c.id}
              onSelect={onSelect}
              onBeginConnect={onBeginConnect}
              onFinishConnect={onFinishConnect}
              isConnectSource={connectFrom === c.id}
              hasPendingConnection={!!connectFrom}
              isConnecting={isConnecting}
              connected={connected}
            />
          );
        })}
      </div>

      {/* SVG edges ABOVE blocks (z-20) */}
      <svg
        className="absolute inset-0 z-20 pointer-events-none"
        width="100%"               
        height="100%"              
        preserveAspectRatio="none" 
        style={{ overflow: "visible" }}
        data-dx={dragPointer?.x ?? 0}
        data-dy={dragPointer?.y ?? 0}
      >
        <defs>
          <marker id="bw-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="6" markerHeight="6" orient="auto">
            <path d="M0,0 L10,5 L0,10 Z" fill="#2563eb" />
          </marker>
        </defs>
        {/* DEBUG: show port centers */}
        {droppedComponents.map((c) => {
          const p = portCenter(c.id);
          return <circle key={`dbg-${c.id}`} cx={p.x} cy={p.y} r={2.5} fill="#ef4444" />;
        })}
        {edges.map((e) => {
          const a = portCenter(e.fromId);
          const b = portCenter(e.toId);
          return (
            <line
              key={e.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="#2563eb"
              strokeWidth="2"
              strokeLinecap="round"
              markerEnd="url(#bw-arrow)"
            />
          );
        })}
        {/* rubber-band preview */}
        {isConnecting && connectFrom && (() => {
          const a = portCenter(connectFrom);
          const b = previewPoint();
          return (
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              stroke="#94a3b8" strokeDasharray="6 4" strokeWidth="2" strokeLinecap="round" />
          );
        })()}
      </svg>

      {droppedComponents.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-4">🧱</div>
            <p className="text-lg font-medium">Start Building Your Architecture</p>
            <p className="text-sm mt-2">Drag components from the sidebar to begin</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CanvasArea;
