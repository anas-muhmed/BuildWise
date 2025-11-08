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

// 🎯 TIER 1: Import localStorage utilities
import { saveDesign, SavedDesign } from "@/lib/localStorage";

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

    // 🎯 TIER 1: Randomized AI Thinking - Makes AI feel human, not scripted
    // Multiple phrase variations for each step to avoid repetition
    const thinkingPhrases = [
      [
        "Analyzing architecture patterns...",
        "Studying system requirements...",
        "Examining scalability needs...",
        "Evaluating infrastructure options...",
      ],
      [
        "Detecting microservice boundaries...",
        "Identifying service dependencies...",
        "Mapping data flow patterns...",
        "Discovering component relationships...",
      ],
      [
        "Optimizing scalability and fault-tolerance...",
        "Calculating resource allocation...",
        "Planning redundancy strategies...",
        "Designing failure recovery paths...",
      ],
      [
        "Generating diagram layout...",
        "Positioning architecture components...",
        "Creating visual hierarchy...",
        "Arranging service topology...",
      ],
      [
        "Finalizing insights...",
        "Preparing best practices...",
        "Generating recommendations...",
        "Compiling architecture summary...",
      ],
    ];

    // Pick random phrase from each category
    const steps = thinkingPhrases.map(
      (phrases) => phrases[Math.floor(Math.random() * phrases.length)]
    );
    
    // Add each thinking step with variable timing (400-600ms for natural feel)
    for (let i = 0; i < steps.length; i++) {
      dispatch({ type: "ADD_AI_THINKING", payload: steps[i] });
      const delay = 400 + Math.random() * 200; // Random 400-600ms
      await new Promise((r) => setTimeout(r, delay));
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

    // 🎯 TIER 1: Auto-save to localStorage after successful generation
    saveDesign({
      prompt: state.prompt,
      nodes: mock.nodes,
      edges: mock.edges,
      explanations: mock.explanations,
    });
  }

  // 🎯 TIER 1: Handler to load a saved design
  function handleLoadDesign(design: SavedDesign) {
    // Update prompt
    dispatch({ type: "SET_PROMPT", payload: design.prompt });
    
    // Load the architecture
    dispatch({
      type: "GENERATE_SUCCESS",
      payload: {
        nodes: design.nodes,
        edges: design.edges,
        explanations: design.explanations,
      },
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
          onLoadDesign={handleLoadDesign}
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
          nodes={state.architecture.nodes}
        />
      </div>
    </div>
  );
}
