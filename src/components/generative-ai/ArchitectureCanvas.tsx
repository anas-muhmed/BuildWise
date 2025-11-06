// components/generative-ai/ArchitectureCanvas.tsx
"use client";
import React, { useMemo } from "react";
import { FiRefreshCcw, FiDownload, FiCpu, FiTrash2 } from "react-icons/fi";
import { FaDatabase, FaBolt, FaCogs, FaNetworkWired } from "react-icons/fa";

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
      className="relative w-full h-[520px] bg-white rounded-xl border shadow-inner overflow-hidden"
      style={{
        backgroundImage:
          "linear-gradient(#f3f4f6 1px, transparent 1px), linear-gradient(90deg,#f3f4f6 1px, transparent 1px)",
        backgroundSize: "32px 32px, 32px 32px",
      }}
    >
      {/* 🎯 CONDITIONAL RENDERING: Floating Toolbar - Only shows when nodes exist */}
      {nodes.length > 0 && (
        <div className="absolute top-3 right-3 flex gap-2 bg-white/80 backdrop-blur-md px-3 py-2 rounded-lg shadow-md border">
          <button 
            title="Regenerate" 
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
          className="absolute flex flex-col items-center bg-white border-2 border-gray-200 rounded-xl shadow-lg px-3 py-2 min-w-[120px] text-sm font-semibold transition-all hover:scale-110 hover:shadow-xl cursor-pointer"
          style={{
            left: n.x,
            top: n.y,
            animation: `fadeInUp 0.6s ease forwards`,
            animationDelay: `${index * 0.05}s`,
            opacity: 0,
          }}
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

      {/* 🎯 LOADING STATE: AI Thinking Animation */}
      {loading && (
        <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center">
          {aiThinking.map((line, idx) => (
            <p
              key={idx}
              className="text-gray-600 text-sm mb-1 animate-pulse"
              style={{ animationDelay: `${idx * 0.3}s` }}
            >
              {line}
            </p>
          ))}
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
      `}</style>
    </div>
  );
}
