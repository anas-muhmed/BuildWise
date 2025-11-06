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
    <div className="bg-gradient-to-r from-blue-50 to-white border rounded-lg p-4 flex gap-3 items-center shadow-sm mb-4">
      {/* Input Field */}
      <input
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="flex-1 px-4 py-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-400 outline-none"
        placeholder="Describe your application (e.g. food delivery, chat app)"
      />

      {/* Generate Button */}
      <button
        onClick={onGenerate}
        disabled={loading}
        className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Generating..." : "Generate Design"}
      </button>

      {/* Quick Prompt Buttons */}
      <button
        onClick={() => setPrompt("Real-time chat app like WhatsApp")}
        className="px-3 py-2 text-sm border rounded hover:bg-slate-50"
        title="Generate chat app architecture"
      >
        💬 Chat App
      </button>

      <button
        onClick={() => setPrompt("E-commerce platform with cart and checkout")}
        className="px-3 py-2 text-sm border rounded hover:bg-slate-50"
        title="Generate e-commerce architecture"
      >
        🛒 E-commerce
      </button>

      <button
        onClick={() => setPrompt("Food delivery app like Swiggy")}
        className="px-3 py-2 text-sm border rounded hover:bg-slate-50"
        title="Generate food delivery architecture"
      >
        🍔 Food Delivery
      </button>
    </div>
  );
}
