// components/GenerateAIClient.tsx
"use client";
import React, { useState, useEffect } from "react";

// 🎯 LEARNING: Import our new sub-components
import Toolbar from "./generative-ai/Toolbar";
import ArchitectureCanvas, { Node, Edge } from "./generative-ai/ArchitectureCanvas";
import InsightsPanel from "./generative-ai/InsightsPanel";

// 🎯 LEARNING: Main component is now a "Container Component"
// It manages STATE and LOGIC, but delegates RENDERING to child components
export default function GenerateAIClient() {
  // 🎯 STATE: All the data our app needs
  const [prompt, setPrompt] = useState("I want to build a scalable food delivery app like Swiggy");
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [explanations, setExplanations] = useState<string[]>([]);
  const [displayedText, setDisplayedText] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "best" | "cost">("overview");
  const [aiThinking, setAiThinking] = useState<string[]>([]);

  // 🎯 BUSINESS LOGIC: Mock AI Generator
  // TODO: In future, move this to /lib/mockGenerator.ts for better organization
  function generateMockFromPrompt(text: string) {
    const t = text.toLowerCase();
    if (t.includes("food") || t.includes("delivery") || t.includes("swiggy")) {
      return {
        nodes: [
          { id: "frontend", label: "MOBILE APP", x: 120, y: 80 },
          { id: "loadbalancer", label: "LOAD BALANCER", x: 320, y: 60 },
          { id: "api-gateway", label: "API GATEWAY", x: 520, y: 60 },
          { id: "user-service", label: "USER SERVICE", x: 320, y: 160 },
          { id: "restaurant-service", label: "RESTAURANT SERVICE", x: 520, y: 160 },
          { id: "order-service", label: "ORDER SERVICE", x: 320, y: 240 },
          { id: "payment-service", label: "PAYMENT SERVICE", x: 520, y: 240 },
          { id: "db", label: "DATABASE", x: 320, y: 340 },
          { id: "cache", label: "REDIS CACHE", x: 520, y: 340 },
        ],
        edges: [
          { source: "frontend", target: "loadbalancer" },
          { source: "loadbalancer", target: "api-gateway" },
          { source: "api-gateway", target: "user-service" },
          { source: "api-gateway", target: "restaurant-service" },
          { source: "api-gateway", target: "order-service" },
          { source: "order-service", target: "payment-service" },
          { source: "order-service", target: "db" },
          { source: "restaurant-service", target: "cache" },
        ],
        explanations: [
          "Load Balancer distributes requests across backend servers to handle peak demand efficiently.",
          "API Gateway secures and routes client requests to appropriate microservices.",
          "Redis Cache improves performance by reducing redundant database queries.",
          "Microservices isolate failures: payment or order issues don't crash the entire system.",
        ],
      };
    }
    return {
      nodes: [
        { id: "frontend", label: "FRONTEND", x: 120, y: 100 },
        { id: "backend", label: "BACKEND", x: 320, y: 180 },
        { id: "db", label: "DATABASE", x: 520, y: 260 },
      ],
      edges: [
        { source: "frontend", target: "backend" },
        { source: "backend", target: "db" },
      ],
      explanations: [
        "Frontend communicates with backend via REST APIs.",
        "Backend connects to Database for persistent storage.",
      ],
    };
  }

  // 🎯 HANDLER: Generate Architecture
  async function handleGenerate() {
    setLoading(true);
    setDisplayedText([]);
    setAiThinking([]);
    setNodes([]);
    setEdges([]);

    // 🎯 LEARNING: AI Thinking Simulation
    // Shows progressive steps to make AI feel more realistic
    const steps = [
      "Analyzing architecture patterns...",
      "Detecting microservice boundaries...",
      "Optimizing scalability and fault-tolerance...",
      "Generating diagram layout...",
      "Finalizing insights...",
    ];
    
    for (let i = 0; i < steps.length; i++) {
      setAiThinking((prev) => [...prev, steps[i]]);
      await new Promise((r) => setTimeout(r, 500));
    }

    const mock = generateMockFromPrompt(prompt);
    setNodes(mock.nodes);
    setEdges(mock.edges);
    setExplanations(mock.explanations);
    setLoading(false);
  }

  // 🎯 EFFECT: Typing animation for explanations
  // Displays explanations one by one with delay for AI feel
  useEffect(() => {
    if (!loading && explanations.length > 0) {
      let idx = 0;
      const interval = setInterval(() => {
        setDisplayedText((prev) => [...prev, explanations[idx]]);
        idx++;
        if (idx >= explanations.length) clearInterval(interval);
      }, 700);
      return () => clearInterval(interval);
    }
  }, [loading, explanations]);

  // 🎯 HANDLER: Export Design as JSON
  const exportDesign = () => {
    const data = { nodes, edges, explanations };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "buildwise-design.json";
    a.click();
  };

  // 🎯 HANDLER: Clear Design
  const clearDesign = () => {
    setNodes([]);
    setEdges([]);
    setExplanations([]);
    setDisplayedText([]);
    setAiThinking([]);
  };

  // 🎯 RENDER: Component Composition
  // Notice how clean this is! All the complex UI is delegated to sub-components
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column: Toolbar + Canvas */}
      <div className="col-span-8">
        {/* 🎯 Toolbar Component - Handles input and quick prompts */}
        <Toolbar
          prompt={prompt}
          setPrompt={setPrompt}
          onGenerate={handleGenerate}
          loading={loading}
        />

        {/* 🎯 Canvas Component - Handles all diagram rendering */}
        <ArchitectureCanvas
          nodes={nodes}
          edges={edges}
          loading={loading}
          aiThinking={aiThinking}
          onRegenerate={handleGenerate}
          onExport={exportDesign}
          onClear={clearDesign}
        />
      </div>

      {/* Right Column: Insights Panel */}
      <div className="col-span-4">
        {/* 🎯 InsightsPanel Component - Handles tabs and content display */}
        <InsightsPanel
          displayedText={displayedText}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          nodeCount={nodes.length}
          edgeCount={edges.length}
        />
      </div>
    </div>
  );
}
