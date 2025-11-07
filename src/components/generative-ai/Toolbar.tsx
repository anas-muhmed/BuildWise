// components/generative-ai/Toolbar.tsx
"use client";
import React from "react";

// 🎯 LEARNING: Props Interface
// This defines what data this component needs from its parent
interface ToolbarProps {
  prompt: string;                          // Current text in input
  setPrompt: (value: string) => void;      // Function to update prompt
  onGenerate: () => void;                  // Function to trigger generation
  loading: boolean;                        // Is AI currently generating?
}

// 🎯 LEARNING: Destructuring Props
// We extract only what we need from props object
export default function Toolbar({ prompt, setPrompt, onGenerate, loading }: ToolbarProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-100 rounded-lg p-4 flex gap-3 items-center shadow-md mb-4">
      {/* Input Field with enhanced styling */}
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="flex-1 px-4 py-2.5 border border-blue-200 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white/80 backdrop-blur-sm transition-all"
        placeholder="Describe your application (e.g. food delivery, chat app)"
      />

      {/* Generate Button with gradient */}
      <button
        onClick={onGenerate}
        disabled={loading}
        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all hover:scale-105 active:scale-95"
      >
        {loading ? "🧠 Generating..." : "✨ Generate Design"}
      </button>

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
