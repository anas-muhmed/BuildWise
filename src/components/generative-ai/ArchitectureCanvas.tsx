// components/generative-ai/ArchitectureCanvas.tsx
"use client";
import React, { useMemo, useState } from "react";
import { FiRefreshCcw, FiDownload, FiCpu, FiTrash2, FiZoomIn, FiZoomOut } from "react-icons/fi";
import { FaDatabase, FaBolt, FaCogs, FaNetworkWired } from "react-icons/fa";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import NodeModal from "./NodeModal";

// 🎯 LEARNING: Type Definitions
// Shared types for our architecture nodes and connections
export type Node = { id: string; label: string; x: number; y: number };
export type Edge = { source: string; target: string };

// 🎯 LEARNING: Props Interface for Canvas
interface CanvasProps {
  nodes: Node[];
  edges: Edge[];
  loading: boolean;
  aiThinking: string[];
  onRegenerate: () => void;
  onExport: () => void;
  onClear: () => void;
}

export default function ArchitectureCanvas({
  nodes,
  edges,
  loading,
  aiThinking,
  onRegenerate,
  onExport,
  onClear,
}: CanvasProps) {
  // 🎯 NEW: Modal state management
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  
  // 🎯 LEARNING: useMemo for Performance
  // This only recalculates when 'nodes' array changes
  // Prevents unnecessary calculations on every render
  const nodeCenters = useMemo(() => {
    const map = new Map<string, { cx: number; cy: number }>();
    nodes.forEach((n) => map.set(n.id, { cx: n.x + 60, cy: n.y + 20 }));
    return map;
  }, [nodes]);

  // 🎯 LEARNING: Helper Function
  // Pure function - no side effects, just returns icon based on label
  const getIcon = (label: string) => {
    const lower = label.toLowerCase();
    if (lower.includes("db")) return <FaDatabase className="text-blue-500" />;
    if (lower.includes("cache")) return <FaBolt className="text-yellow-500" />;
    if (lower.includes("gateway")) return <FaNetworkWired className="text-purple-500" />;
    if (lower.includes("service")) return <FaCogs className="text-green-600" />;
    return <FiCpu className="text-gray-500" />;
  };

  return (
    <div
      className="relative w-full h-[520px] bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-xl border shadow-inner overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(#e0e7ff 1px, transparent 1px), linear-gradient(90deg,#e0e7ff 1px, transparent 1px)",
        backgroundSize: "32px 32px, 32px 32px",
      }}
    >
      {/* 🎯 LEARNING: TransformWrapper - Enables zoom & pan functionality */}
      {/* This wraps our canvas and provides zoom/pan controls */}
      <TransformWrapper
        initialScale={1}
        minScale={0.5}
        maxScale={3}
        centerOnInit
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            {/* 🎯 CONDITIONAL RENDERING: Floating Toolbar - Only shows when nodes exist */}
            {nodes.length > 0 && (
              <div className="absolute top-3 right-3 flex gap-2 bg-white/80 backdrop-blur-md px-3 py-2 rounded-lg shadow-md border z-10">
                {/* 🎯 NEW: Zoom Controls */}
                <button 
                  title="Zoom In" 
                  onClick={() => zoomIn()} 
                  className="hover:text-blue-600 transition-colors"
                >
                  <FiZoomIn size={18} />
                </button>
                <button 
                  title="Zoom Out" 
                  onClick={() => zoomOut()} 
                  className="hover:text-blue-600 transition-colors"
                >
                  <FiZoomOut size={18} />
                </button>
                <button 
                  title="Reset View" 
                  onClick={() => resetTransform()} 
                  className="hover:text-purple-600 transition-colors"
                >
                  <FiRefreshCcw size={18} />
                </button>
                <div className="border-l border-gray-300 mx-1"></div>
                <button 
                  title="Regenerate Design" 
                  onClick={onRegenerate} 
                  className="hover:text-blue-600 transition-colors"
                >
                  <FiRefreshCcw size={18} />
                </button>
                <button 
                  title="Export JSON" 
                  onClick={onExport} 
                  className="hover:text-green-600 transition-colors"
                >
                  <FiDownload size={18} />
                </button>
                <button 
                  title="Clear" 
                  onClick={onClear} 
                  className="hover:text-red-600 transition-colors"
                >
                  <FiTrash2 size={18} />
                </button>
              </div>
            )}

            {/* 🎯 TransformComponent - The zoomable/pannable area */}
            <TransformComponent
              wrapperStyle={{ width: "100%", height: "100%" }}
              contentStyle={{ width: "100%", height: "100%" }}
            >
              {/* 🎯 SVG LAYER: Edges (connections between nodes) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {edges.map((e, i) => {
          const src = nodeCenters.get(e.source);
          const tgt = nodeCenters.get(e.target);
          if (!src || !tgt) return null;
          
          // 🎯 LEARNING: Quadratic Bezier Curve for smooth connections
          const midX = (src.cx + tgt.cx) / 2;
          const path = `M ${src.cx} ${src.cy} Q ${midX} ${(src.cy + tgt.cy) / 2} ${tgt.cx} ${tgt.cy}`;
          
          return (
            <path
              key={i}
              d={path}
              stroke="#2563eb"
              strokeWidth={2.5}
              fill="none"
              strokeLinecap="round"
              markerEnd="url(#arrowhead)"
            />
          );
        })}
        <defs>
          {/* 🎯 SVG Marker: Arrowhead at end of connections */}
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="8"
            refY="3.5"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#2563eb" />
          </marker>
        </defs>
      </svg>

      {/* 🎯 NODES LAYER: Component boxes */}
      {nodes.map((n, index) => (
        <div
          key={n.id}
          onClick={() => setSelectedNode(n)}
          className="absolute flex flex-col items-center bg-white border-2 border-gray-200 rounded-xl shadow-lg px-3 py-2 min-w-[120px] text-sm font-semibold transition-all hover:scale-110 hover:shadow-xl hover:border-blue-400 cursor-pointer"
          style={{
            left: n.x,
            top: n.y,
            animation: `fadeInUp 0.6s ease forwards`,
            animationDelay: `${index * 0.05}s`,
            opacity: 0,
          }}
          title="Click for details"
        >
          <div className="text-xl mb-1">{getIcon(n.label)}</div>
          {n.label}
        </div>
      ))}

      {/* 🎯 EMPTY STATE: Shows when no architecture generated */}
      {nodes.length === 0 && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <div className="text-5xl mb-3">🧠</div>
          <p className="font-medium">Your AI-generated architecture will appear here</p>
          <p className="text-sm mt-2">Describe any system. Let BuildWise think for you 🤖</p>
        </div>
      )}

      {/* 🎯 LOADING STATE: AI Thinking Animation with Progress Bar */}
      {loading && (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/95 via-indigo-50/95 to-purple-50/95 backdrop-blur-sm flex flex-col items-center justify-center">
          {/* 🎯 AI Brain Icon with pulse animation */}
          <div className="text-6xl mb-4 animate-bounce">🧠</div>
          
          {/* 🎯 Progress indicator */}
          <div className="w-64 bg-gray-200 rounded-full h-2 mb-6 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${(aiThinking.length / 5) * 100}%` }}
            />
          </div>

          {/* 🎯 AI Thinking steps */}
          <div className="space-y-2">
            {aiThinking.map((line, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 text-gray-700 text-sm font-medium"
                style={{ 
                  animation: 'fadeInLeft 0.4s ease-out',
                  animationDelay: `${idx * 0.1}s`,
                  opacity: 0,
                  animationFillMode: 'forwards'
                }}
              >
                <div className="flex gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0s' }}></span>
                  <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                  <span className="inline-block w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                </div>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🎯 CSS ANIMATIONS */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        }
      `}</style>

            </TransformComponent>
          </>
        )}
      </TransformWrapper>

      {/* 🎯 NODE DETAILS MODAL: Shows when a node is clicked */}
      {selectedNode && (
        <NodeModal
          node={selectedNode}
          edges={edges}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}
