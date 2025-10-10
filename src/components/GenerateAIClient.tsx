// components/GenerateAIClient.tsx
"use client";
import React, { useState, useMemo } from "react";

// Data models for our generated architecture
type Node = {
  id: string; // unique identifier
  label: string; // display name (e.g., "FRONTEND", "DATABASE")
  x: number; // position on canvas
  y: number;
};

type Edge = {
  source: string; // id of source node
  target: string; // id of target node
};

export default function GenerateAIClient() {
  // State management - each piece has a specific purpose
  const [prompt, setPrompt] = useState(
    "I want to build a scalable food delivery app like Swiggy"
  );
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [explanations, setExplanations] = useState<string[]>([]);

  // Mock AI Generation Function - This simulates what a real AI would do
  function generateMockFromPrompt(text: string) {
    const t = text.toLowerCase();

    // Pattern matching based on keywords (simple AI simulation)
    if (t.includes("food") || t.includes("delivery") || t.includes("swiggy")) {
      return {
        nodes: [
          { id: "frontend", label: "FRONTEND", x: 120, y: 80 },
          { id: "loadbalancer", label: "LOAD BALANCER", x: 560, y: 60 },
          { id: "backend", label: "BACKEND", x: 320, y: 200 },
          { id: "db", label: "DATABASE", x: 520, y: 300 },
          { id: "cache", label: "CACHE (Redis)", x: 320, y: 320 },
        ],
        edges: [
          { source: "frontend", target: "loadbalancer" },
          { source: "loadbalancer", target: "backend" },
          { source: "backend", target: "db" },
          { source: "backend", target: "cache" },
        ],
        explanations: [
          "Load Balancer added to distribute user traffic across backend instances.",
          "Cache (Redis) added to reduce repeated DB reads and improve latency.",
          "Database placed behind Backend for security and transactional guarantees.",
        ],
      };
    }

    // Default simple web app pattern
    return {
      nodes: [
        { id: "frontend", label: "FRONTEND", x: 120, y: 120 },
        { id: "backend", label: "BACKEND", x: 320, y: 200 },
        { id: "db", label: "DATABASE", x: 520, y: 260 },
      ],
      edges: [
        { source: "frontend", target: "backend" },
        { source: "backend", target: "db" },
      ],
      explanations: [
        "Standard frontend → backend → db pattern for a simple web app.",
        "Consider adding caching and auth services when scaling up.",
      ],
    };
  }

  // Generation Handler - This gets called when user clicks "Generate"
  async function handleGenerate() {
    setLoading(true);

    // Simulate "thinking" delay (like real AI)
    await new Promise((r) => setTimeout(r, 700));

    // Generate the architecture
    const mock = generateMockFromPrompt(prompt);
    setNodes(mock.nodes);
    setEdges(mock.edges);
    setExplanations(mock.explanations);

    setLoading(false);
  }

  // Compute node centers for drawing edges - this is performance optimized!
  const nodeCenters = useMemo(() => {
    const map = new Map<string, { cx: number; cy: number }>();
    nodes.forEach((n) => {
      map.set(n.id, { cx: n.x + 60, cy: n.y + 20 }); // node width ~120, height ~40 assumption
    });
    return map;
  }, [nodes]);

  // TODO: We'll add the UI next

  return (
  <div className="grid grid-cols-12 gap-6">
    {/* Left side: Input + Canvas (8 columns) */}
    <div className="col-span-8">
      <input
      value={prompt}
      onChange={(e)=>setPrompt(e.target.value)}
      className="flex-1 px-4 py-3 broder rounded-lg"
      placeholder="Describe your application.!"
      />

      <button
      onClick={handleGenerate}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white">
        {loading ? "Generating..." : "Generate Design"}
        </button>
      
      {/* Canvas area - we'll build this next */}
      <div>Canvas goes here</div>
    </div>

    {/* Right side: Explanations (4 columns) */}
    <div className="col-span-4">
      {/* Explanations panel - we'll build this after canvas */}
      <div>Explanations go here</div>
    </div>
  </div>
);
}
