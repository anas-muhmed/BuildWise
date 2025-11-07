// components/GenerateAIClient.tsx
"use client";
import React, { useReducer, useEffect } from "react";

// 🎯 LEARNING: Import our new sub-components
import Toolbar from "./generative-ai/Toolbar";
import ArchitectureCanvas from "./generative-ai/ArchitectureCanvas";
import InsightsPanel from "./generative-ai/InsightsPanel";

// 🎯 NEW: Import our reducer logic
import { appReducer, initialState } from "@/lib/reducer";

// 🎯 NEW: Import mock generator utility (moved from this file!)
import { generateMockFromPrompt } from "@/lib/mockGenerator";

// 🎯 LEARNING: Main component is now a "Container Component"
// It manages STATE and LOGIC, but delegates RENDERING to child components
export default function GenerateAIClient() {
  // 🎯 NEW STATE MANAGEMENT: useReducer replaces 8 useState calls!
  // state = all our data in one organized object
  // dispatch = function to send actions to the reducer
  const [state, dispatch] = useReducer(appReducer, initialState);

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
