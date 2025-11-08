// components/generative-ai/Toolbar.tsx
"use client";
import React, { useState } from "react";
import { loadDesigns, SavedDesign, formatTimestamp } from "@/lib/localStorage";

// 🎯 LEARNING: Props Interface
// This defines what data this component needs from its parent
interface ToolbarProps {
  prompt: string;                          // Current text in input
  setPrompt: (value: string) => void;      // Function to update prompt
  onGenerate: () => void;                  // Function to trigger generation
  loading: boolean;                        // Is AI currently generating?
  onLoadDesign: (design: SavedDesign) => void; // NEW: Function to load saved design
}

// 🎯 LEARNING: Destructuring Props
// We extract only what we need from props object
export default function Toolbar({ prompt, setPrompt, onGenerate, loading, onLoadDesign }: ToolbarProps) {
  // 🎯 LEARNING: Local State for Dropdown
  // useState tracks whether the "Load Previous" dropdown is open or closed
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // 🎯 LEARNING: Fetch Saved Designs
  // This gets all saved designs from localStorage (max 3)
  const savedDesigns = loadDesigns();
  
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-center shadow-md mb-4">
      {/* Input Field with enhanced styling - Disabled during generation */}
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        disabled={loading}
        className="flex-1 px-4 py-2.5 border border-blue-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white/80 backdrop-blur-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        placeholder="Describe your system (e.g., scalable food delivery app, SaaS dashboard, e-commerce platform)"
      />

      {/* Generate Button with gradient - More dominant with enhanced glow */}
      <button
        onClick={onGenerate}
        disabled={loading}
        className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl shadow-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base transition-all hover:scale-110 hover:shadow-2xl hover:shadow-blue-500/60 active:scale-95 animate-pulse-glow"
      >
        {loading ? "🧠 Generating..." : "✨ Generate Design"}
      </button>

      {/* 🎯 LEARNING: Load Previous Designs - Dropdown Button */}
      {/* This is a "relative" positioned container so dropdown can be "absolute" positioned inside it */}
      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          disabled={savedDesigns.length === 0}
          className="px-4 py-2.5 bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-lg hover:from-green-700 hover:to-teal-700 shadow-lg shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all hover:scale-105 active:scale-95"
          title="Load previously saved designs"
        >
          📂 Load Previous
        </button>

        {/* 🎯 LEARNING: Dropdown Menu */}
        {/* Only shows when isDropdownOpen is true AND there are saved designs */}
        {isDropdownOpen && savedDesigns.length > 0 && (
          <div className="absolute top-full mt-2 right-0 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
            <div className="p-2">
              <div className="text-xs font-semibold text-gray-500 px-3 py-2">
                Recent Designs (Last 3)
              </div>
              {savedDesigns.map((design) => (
                <button
                  key={design.id}
                  onClick={() => {
                    onLoadDesign(design); // Load the design
                    setIsDropdownOpen(false); // Close dropdown
                  }}
                  className="w-full text-left px-3 py-2.5 hover:bg-blue-50 rounded-lg transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600">
                        {design.prompt}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatTimestamp(design.timestamp)}
                      </div>
                    </div>
                    <div className="text-lg">💾</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompt Buttons with enhanced hover */}
      <button
        onClick={() => setPrompt("Real-time chat app like WhatsApp")}
        className="px-3 py-2 text-sm border border-blue-200 rounded-lg hover:bg-white hover:shadow-md hover:scale-105 transition-all bg-white/60"
        title="Generate chat app architecture"
      >
        💬 Chat App
      </button>

      <button
        onClick={() => setPrompt("E-commerce platform with cart and checkout")}
        className="px-3 py-2 text-sm border border-blue-200 rounded-lg hover:bg-white hover:shadow-md hover:scale-105 transition-all bg-white/60"
        title="Generate e-commerce architecture"
      >
        🛒 E-commerce
      </button>

      <button
        onClick={() => setPrompt("Food delivery app like Swiggy")}
        className="px-3 py-2 text-sm border border-blue-200 rounded-lg hover:bg-white hover:shadow-md hover:scale-105 transition-all bg-white/60"
        title="Generate food delivery architecture"
      >
        🍔 Food Delivery
      </button>
    </div>
  );
}
