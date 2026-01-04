"use client";
import React from "react";
import { SavedDesign } from "@/lib/localStorage";

interface ToolbarProps {
  prompt: string;
  setPrompt: (value: string) => void;
  onGenerate: () => void;
  loading: boolean;
  onLoadDesign: (design: SavedDesign) => void;
}

export default function Toolbar({
  prompt,
  setPrompt,
  onGenerate,
  loading,
}: ToolbarProps) {
  const quickPrompts = [
    "E-commerce Platform",
    "Social Media App",
    "Banking System",
    "Streaming Service",
  ];

  return (
    <div className="mb-4 space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your system architecture..."
          className="flex-1 px-4 py-2 border rounded-lg"
          disabled={loading}
        />
        <button
          onClick={onGenerate}
          disabled={loading || !prompt.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? "Generating..." : "Generate"}
        </button>
      </div>
      
      <div className="flex gap-2">
        <span className="text-sm text-gray-600">Quick prompts:</span>
        {quickPrompts.map((qp) => (
          <button
            key={qp}
            onClick={() => setPrompt(qp)}
            disabled={loading}
            className="text-sm px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            {qp}
          </button>
        ))}
      </div>
    </div>
  );
}
