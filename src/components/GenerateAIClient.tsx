// components/GenerateAIClient.tsx
"use client";
import React, { useReducer, useEffect } from "react";

// 🎯 LEARNING: Import our new sub-components
import Toolbar from "./generative-ai/Toolbar";
import ArchitectureCanvas from "./generative-ai/ArchitectureCanvas";
import InsightsPanel from "./generative-ai/InsightsPanel";

// 🎯 NEW: Import our reducer logic
import { appReducer, initialState } from "@/lib/reducer";

// 🎯 LEARNING: Main component is now a "Container Component"
// It manages STATE and LOGIC, but delegates RENDERING to child components
export default function GenerateAIClient() {
  // 🎯 NEW STATE MANAGEMENT: useReducer replaces 8 useState calls!
  // state = all our data in one organized object
  // dispatch = function to send actions to the reducer
  const [state, dispatch] = useReducer(appReducer, initialState);

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
    // 🎯 LEARNING: Instead of multiple setState calls, we dispatch ONE action!
    dispatch({ type: "GENERATE_START" });

    // 🎯 LEARNING: AI Thinking Simulation
    // Shows progressive steps to make AI feel more realistic
    const steps = [
      "Analyzing architecture patterns...",
      "Detecting microservice boundaries...",
      "Optimizing scalability and fault-tolerance...",
      "Generating diagram layout...",
      "Finalizing insights...",
    ];
    
    // Add each thinking step one by one
    for (let i = 0; i < steps.length; i++) {
      dispatch({ type: "ADD_AI_THINKING", payload: steps[i] });
      await new Promise((r) => setTimeout(r, 500));
    }

    // Generate the mock architecture
    const mock = generateMockFromPrompt(state.prompt);
    
    // Dispatch success with all the data at once!
    dispatch({ 
      type: "GENERATE_SUCCESS", 
      payload: {
        nodes: mock.nodes,
        edges: mock.edges,
        explanations: mock.explanations
      }
    });
  }

  // 🎯 EFFECT: Typing animation for explanations
  // Displays explanations one by one with delay for AI feel
  useEffect(() => {
    if (!state.loadingState.loading && state.architecture.explanations.length > 0) {
      let idx = 0;
      const interval = setInterval(() => {
        dispatch({ 
          type: "ADD_DISPLAYED_TEXT", 
          payload: state.architecture.explanations[idx] 
        });
        idx++;
        if (idx >= state.architecture.explanations.length) clearInterval(interval);
      }, 700);
      return () => clearInterval(interval);
    }
  }, [state.loadingState.loading, state.architecture.explanations]);

  // 🎯 HANDLER: Export Design as JSON
  const exportDesign = () => {
    const data = { 
      nodes: state.architecture.nodes, 
      edges: state.architecture.edges, 
      explanations: state.architecture.explanations 
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "buildwise-design.json";
    a.click();
  };

  // 🎯 HANDLER: Clear Design
  const clearDesign = () => {
    dispatch({ type: "CLEAR_DESIGN" });
  };

  // 🎯 RENDER: Component Composition
  // Notice how clean this is! All the complex UI is delegated to sub-components
  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Column: Toolbar + Canvas */}
      <div className="col-span-8">
        {/* 🎯 Toolbar Component - Handles input and quick prompts */}
        <Toolbar
          prompt={state.prompt}
          setPrompt={(value) => dispatch({ type: "SET_PROMPT", payload: value })}
          onGenerate={handleGenerate}
          loading={state.loadingState.loading}
        />

        {/* 🎯 Canvas Component - Handles all diagram rendering */}
        <ArchitectureCanvas
          nodes={state.architecture.nodes}
          edges={state.architecture.edges}
          loading={state.loadingState.loading}
          aiThinking={state.loadingState.aiThinking}
          onRegenerate={handleGenerate}
          onExport={exportDesign}
          onClear={clearDesign}
        />
      </div>

      {/* Right Column: Insights Panel */}
      <div className="col-span-4">
        {/* 🎯 InsightsPanel Component - Handles tabs and content display */}
        <InsightsPanel
          displayedText={state.ui.displayedText}
          activeTab={state.ui.activeTab}
          setActiveTab={(tab) => dispatch({ type: "SET_ACTIVE_TAB", payload: tab })}
          nodeCount={state.architecture.nodes.length}
          edgeCount={state.architecture.edges.length}
        />
      </div>
    </div>
  );
}
