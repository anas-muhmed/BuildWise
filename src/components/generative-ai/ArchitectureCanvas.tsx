"use client";
import React from "react";

interface Node {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string };
}

interface Edge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface ArchitectureCanvasProps {
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
}: ArchitectureCanvasProps) {
  return (
    <div className="bg-white border rounded-lg p-6 min-h-[600px]">
      {loading ? (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="space-y-2 text-center">
            {aiThinking.map((thought, idx) => (
              <div key={idx} className="text-sm text-gray-600">
                {thought}
              </div>
            ))}
          </div>
        </div>
      ) : nodes.length > 0 ? (
        <>
          <div className="flex justify-between mb-4">
            <h3 className="text-lg font-semibold">Architecture Diagram</h3>
            <div className="space-x-2">
              <button
                onClick={onRegenerate}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                Regenerate
              </button>
              <button
                onClick={onExport}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 rounded"
              >
                Export
              </button>
              <button
                onClick={onClear}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 rounded"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 min-h-[500px]">
            {/* Simple node visualization */}
            {nodes.map((node) => (
              <div
                key={node.id}
                className="absolute bg-white border-2 border-blue-400 rounded-lg p-4 shadow-md"
                style={{
                  left: `${node.position.x}px`,
                  top: `${node.position.y}px`,
                }}
              >
                <div className="text-xs text-gray-500 uppercase">{node.type}</div>
                <div className="font-medium">{node.data.label}</div>
              </div>
            ))}
            
            {/* Edge connections - simplified */}
            <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
              {edges.map((edge) => {
                const source = nodes.find(n => n.id === edge.source);
                const target = nodes.find(n => n.id === edge.target);
                if (!source || !target) return null;
                
                return (
                  <line
                    key={edge.id}
                    x1={source.position.x + 50}
                    y1={source.position.y + 25}
                    x2={target.position.x + 50}
                    y2={target.position.y + 25}
                    stroke="#3b82f6"
                    strokeWidth="2"
                    markerEnd="url(#arrowhead)"
                  />
                );
              })}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
                </marker>
              </defs>
            </svg>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-400">
          <div className="text-center">
            <p className="text-lg mb-2">No architecture generated yet</p>
            <p className="text-sm">Enter a prompt and click Generate to start</p>
          </div>
        </div>
      )}
    </div>
  );
}
